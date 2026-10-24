import sqlite3

def init_db(path='demo.db'):
    conn = sqlite3.connect(path)
    cur = conn.cursor()
    cur.execute('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, role TEXT)')
    cur.execute("INSERT INTO users (name, role) VALUES ('alice', 'user')")
    cur.execute("INSERT INTO users (name, role) VALUES ('bob', 'admin')")
    conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    print('Initialized demo.db with sample users')
