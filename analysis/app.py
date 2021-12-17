#!/bin/python3
import os
import database as DB


dbCred = DB.Credentials(
    host=os.getenv('DB_HOST'),
    user=os.getenv('DB_USER'),
    password=os.getenv('DB_PASSWORD'),
    database=os.getenv('DB_NAME')
)

db = DB.Database(dbCred)

if __name__ == '__main__':
    print(db.getActiveStocks())

    '''
    cur = d.query("SELECT name FROM stocks", None)
    for name in cur:
        print(name)
    '''