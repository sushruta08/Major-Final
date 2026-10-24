from flask import Flask, request, jsonify
import sqlite3
import os
import pickle
from config import ADMIN_USER, ADMIN_PASS, DEBUG

app = Flask(__name__)
app.debug = DEBUG

DB_PATH = 'demo.db'


def query_db(query):
    # Deliberately insecure: string formatting directly into SQL (SQL injection)
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(query)
    rows = cur.fetchall()
    conn.close()
    return rows


@app.route('/search')
def search():
    # user-controlled input used directly in SQL
    user = request.args.get('user', '')
    q = f"SELECT id, name, role FROM users WHERE name = '{user}'"
    rows = query_db(q)
    return jsonify(rows)


@app.route('/run')
def run():
    # Command injection: directly executing user input
    cmd = request.args.get('cmd', '')
    os.system(cmd)  # unsafe
    return 'Executed'


@app.route('/deserialize', methods=['POST'])
def deserialize():
    # Unsafe deserialization of pickled data
    data = request.get_data()
    obj = pickle.loads(data)  # unsafe
    return jsonify({'received': str(obj)})


@app.route('/eval')
def do_eval():
    # Unsafe use of eval on user input
    expr = request.args.get('expr', '')
    result = eval(expr)  # unsafe
    return jsonify({'result': str(result)})


@app.route('/login', methods=['POST'])
def login():
    # Hard-coded credential check
    user = request.form.get('user')
    pwd = request.form.get('pwd')
    if user == ADMIN_USER and pwd == ADMIN_PASS:
        return 'Logged in as admin'
    return 'Invalid credentials', 403


if __name__ == '__main__':
    if not os.path.exists(DB_PATH):
        import init_db
        init_db.init_db(DB_PATH)
    app.run(host='127.0.0.1', port=5000)
