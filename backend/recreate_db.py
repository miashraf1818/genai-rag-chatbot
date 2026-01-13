#!/usr/bin/env python3
"""
Recreate database with updated schema
"""
from backend.database.connection import engine
from backend.database.models import Base, User
from backend.auth.utils import hash_password
import os

# Drop all tables and recreate
print("Dropping existing tables...")
Base.metadata.drop_all(bind=engine)

print("Creating new tables...")
Base.metadata.create_all(bind=engine)

print("✅ Database recreated successfully!")

# Create an admin user for testing
if input("Create admin user? (y/n): ").lower() == 'y':
    from backend.database.connection import SessionLocal
    db = SessionLocal()
    
    admin_email = input("Admin email (default: admin@example.com): ") or "admin@example.com"
    admin_username = input("Admin username (default: admin): ") or "admin"
    admin_password = input("Admin password (default: Admin123!): ") or "Admin123!"
    
    admin_user = User(
        email=admin_email,
        username=admin_username,
        hashed_password=hash_password(admin_password),
        is_admin=True,
        is_active=True,
        is_verified=True
    )
    
    db.add(admin_user)
    db.commit()
    
    print(f"✅ Admin user created: {admin_email}")
    print(f"   Username: {admin_username}")
    print(f"   Password: {admin_password}")
    
    db.close()
