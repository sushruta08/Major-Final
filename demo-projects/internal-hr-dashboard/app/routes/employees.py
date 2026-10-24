"""
Employee management routes — mostly secure patterns with minor issues.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from app.models import Employee
from app.database import get_db
from app.auth import require_role, get_current_user
from app.schemas import EmployeeCreate, EmployeeUpdate, EmployeeResponse

router = APIRouter(prefix="/employees", tags=["Employees"])
logger = logging.getLogger(__name__)


@router.get("/", response_model=List[EmployeeResponse])
def list_employees(
    department: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List employees with optional filtering — safe ORM queries."""
    query = db.query(Employee).filter(Employee.is_active == True)

    if department:
        query = query.filter(Employee.department == department)

    if search:
        # ORM parameterized search — safe from SQL injection
        query = query.filter(
            Employee.first_name.ilike(f"%{search}%") |
            Employee.last_name.ilike(f"%{search}%")
        )

    return query.offset(skip).limit(limit).all()


@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(
    employee_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get single employee — access control enforced."""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Access control: non-HR users can only view their own profile
    if current_user.role not in ("hr", "admin") and current_user.id != employee_id:
        raise HTTPException(status_code=403, detail="Access denied")

    return employee


@router.post("/", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    payload: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["hr", "admin"])),
):
    """Create employee — HR/admin only."""
    employee = Employee(**payload.model_dump())
    db.add(employee)
    db.commit()
    db.refresh(employee)
    logger.info(f"Employee created: {employee.id} by {current_user.username}")
    return employee


@router.patch("/{employee_id}/salary")
def update_salary(
    employee_id: str,
    new_salary: float,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["admin"])),  # Admin only
):
    """Update salary — admin-only endpoint."""
    if new_salary < 0:
        raise HTTPException(status_code=400, detail="Salary cannot be negative")

    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Medium: salary change not rate-limited — bulk changes possible
    employee.salary = new_salary
    db.commit()
    return {"id": employee_id, "salary": new_salary}
