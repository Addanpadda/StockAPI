#!/bin/python3
import os
import database as DB


dbCred = DB.Credentials(
    host=os.getenv('DB_HOST'),
    user=os.getenv('DB_USER'),
    password=os.getenv('DB_PASSWORD'),
    database=os.getenv('DB_NAME')
)

if __name__ == '__main__':
    db = DB.Database(dbCred)
    print(len(db.getActiveStocks()))

    '''
    cur = d.query("SELECT name FROM stocks", None)
    for name in cur:
        print(name)
    '''