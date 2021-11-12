#!/bin/python3
import requests
from bs4 import BeautifulSoup as bs
import re
import os
import sys
import mariadb

url='https://www.avanza.se/frontend/template.html/marketing/advanced-filter/advanced-filter-template?1636483749330&widgets.marketCapitalInSek.filter.lower=&widgets.marketCapitalInSek.filter.upper=&widgets.marketCapitalInSek.active=true&widgets.stockLists.filter.list%5B0%5D=SE.SmallCap.SE&widgets.stockLists.active=true&widgets.numberOfOwners.filter.lower=&widgets.numberOfOwners.filter.upper=&widgets.numberOfOwners.active=true&parameters.startIndex=0&parameters.maxResults=999999'


r = requests.get(url)

if r.status_code != 200:
    print('! Status code: ' + r.status_code)
    exit()

soup = bs(r.text, 'html.parser')
hits = len(soup.find_all('a', {'class': 'ellipsis'}))

print(f"Got {hits} hits")

orderbookIDs = []

# Extracting orderbookIDs
for i in range(0, hits):
    stock_url = soup.find_all('a', {'class': 'ellipsis'})[i]['href']
    orderbookID = re.search('om-aktien.html/(.+?)/', stock_url).group(1)
    if not orderbookID:
        print('! Failed to parse url')
        exit()
    orderbookIDs.append(orderbookID)



# Connect to MariaDB Platform
try:
    conn = mariadb.connect(
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        host=os.getenv('DB_HOST'),
        port=3306,
        database=os.getenv('DB_NAME')
    )
except mariadb.Error as e:
    print(f"Error connecting to MariaDB Platform: {e}")
    sys.exit(1)

# Get Cursor
cur = conn.cursor()

for i in range(0, hits):
    orderbookID = orderbookIDs[i]
    print(f"Inserting orderbookID {i} : {orderbookID}")
    try:
        cur.execute("INSERT INTO stocks VALUES(NULL, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, TRUE);", (orderbookID,))
    except mariadb.Error as e:
        print(f"Error: {e}")

conn.commit()

cur.close()
conn.close()
