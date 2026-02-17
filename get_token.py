#!/usr/bin/env python3
import sys
import json

auth_data = {"username": "admin@example.com", "password": "admin123"}
auth_response = json.load(sys.stdin)
access_token = auth_response.get("access_token", "")
print(access_token)
