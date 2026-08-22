from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId

app = Flask(__name__)
CORS(app)  # Enables CORS for all frontend requests

# MongoDB Connection
client = MongoClient("mongodb://localhost:27017/")
db = client["shiftboard_db"]
employees_col = db["employees"]
shifts_col = db["shifts"]

# Helper to serialize MongoDB ObjectId to string
def format_doc(doc):
    doc["_id"] = str(doc["_id"])
    return doc

# --- EMPLOYEE ROUTES ---

@app.route("/api/employees", methods=["GET"])
def get_employees():
    employees = list(employees_col.find())
    return jsonify([format_doc(emp) for emp in employees]), 200

@app.route("/api/employees", methods=["POST"])
def add_employee():
    data = request.json
    if not data or "name" not in data or "role" not in data:
        return jsonify({"error": "Name and role are required"}), 400
    
    new_emp = {
        "name": data["name"].strip(),
        "role": data["role"].strip()
    }
    result = employees_col.insert_one(new_emp)
    new_emp["_id"] = str(result.inserted_id)
    return jsonify(new_emp), 201

@app.route("/api/employees/<emp_id>", methods=["DELETE"])
def delete_employee(emp_id):
    employees_col.delete_one({"_id": ObjectId(emp_id)})
    shifts_col.delete_many({"employee_id": emp_id})
    return jsonify({"message": "Employee and associated shifts deleted"}), 200

# --- SHIFT ROUTES ---

@app.route("/api/shifts", methods=["GET"])
def get_shifts():
    shifts = list(shifts_col.find())
    return jsonify([format_doc(shift) for shift in shifts]), 200

@app.route("/api/shifts", methods=["POST"])
def create_shift():
    data = request.json
    required_fields = ["employee_id", "employee_name", "date", "slot"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required shift fields"}), 400

    # Conflict Check: Ensure employee is not already scheduled on this exact date
    existing_shift = shifts_col.find_one({
        "employee_id": data["employee_id"],
        "date": data["date"]
    })

    if existing_shift:
        return jsonify({"error": f"{data['employee_name']} is already assigned to a shift on {data['date']}"}), 400

    new_shift = {
        "employee_id": data["employee_id"],
        "employee_name": data["employee_name"],
        "date": data["date"],
        "slot": data["slot"]
    }
    result = shifts_col.insert_one(new_shift)
    new_shift["_id"] = str(result.inserted_id)
    return jsonify(new_shift), 201

@app.route("/api/shifts/<shift_id>", methods=["DELETE"])
def delete_shift(shift_id):
    shifts_col.delete_one({"_id": ObjectId(shift_id)})
    return jsonify({"message": "Shift deleted"}), 200

if __name__ == "__main__":
    app.run(debug=True, use_reloader=False, port=5000)