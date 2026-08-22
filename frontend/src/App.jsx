import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE = "http://localhost:5000/api";
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SLOTS = ["Morning", "Afternoon", "Night"];

function App() {
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  // New Employee Form State
  const [empName, setEmpName] = useState("");
  const [empRole, setEmpRole] = useState("");

  // Schedule Shift Form State
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [selectedSlot, setSelectedSlot] = useState("Morning");

  // Fetch initial data
  useEffect(() => {
    fetchEmployees();
    fetchShifts();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_BASE}/employees`);
      const data = await res.json();
      setEmployees(data);
      if (data.length > 0 && !selectedEmpId) {
        setSelectedEmpId(data[0]._id);
      }
    } catch (err) {
      console.error("Failed to fetch employees", err);
    }
  };

  const fetchShifts = async () => {
    try {
      const res = await fetch(`${API_BASE}/shifts`);
      const data = await res.json();
      setShifts(data);
    } catch (err) {
      console.error("Failed to fetch shifts", err);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!empName || !empRole) return;

    try {
      const res = await fetch(`${API_BASE}/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: empName, role: empRole }),
      });
      if (res.ok) {
        setEmpName("");
        setEmpRole("");
        fetchEmployees();
      }
    } catch (err) {
      console.error("Error adding employee", err);
    }
  };

  const handleDeleteEmployee = async (id) => {
    try {
      await fetch(`${API_BASE}/employees/${id}`, { method: "DELETE" });
      fetchEmployees();
      fetchShifts();
    } catch (err) {
      console.error("Error deleting employee", err);
    }
  };

  const handleAssignShift = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const employee = employees.find((e) => e._id === selectedEmpId);
    if (!employee) return;

    try {
      const res = await fetch(`${API_BASE}/shifts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: employee._id,
          employee_name: employee.name,
          date: selectedDay,
          slot: selectedSlot,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to schedule shift");
      } else {
        fetchShifts();
      }
    } catch (err) {
      setErrorMessage("Network error scheduling shift");
    }
  };

  const handleDeleteShift = async (id) => {
    try {
      await fetch(`${API_BASE}/shifts/${id}`, { method: "DELETE" });
      fetchShifts();
    } catch (err) {
      console.error("Error deleting shift", err);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>ShiftBoard — Staff Scheduler</h1>
        <span>Weekly Overview</span>
      </header>

      {errorMessage && (
        <div className="alert-banner">
          <span>⚠️ {errorMessage}</span>
          <button onClick={() => setErrorMessage("")}>×</button>
        </div>
      )}

      <div className="main-layout">
        {/* Left Sidebar: Management Forms */}
        <div>
          <div className="card">
            <h2>Add Employee</h2>
            <form onSubmit={handleAddEmployee}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Smith"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <input
                  type="text"
                  placeholder="e.g. Barista / Cashier"
                  value={empRole}
                  onChange={(e) => setEmpRole(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">Add Staff</button>
            </form>

            <ul className="emp-list">
              {employees.map((emp) => (
                <li key={emp._id} className="emp-item">
                  <div className="emp-info">
                    <div className="emp-name">{emp.name}</div>
                    <div className="emp-role">{emp.role}</div>
                  </div>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteEmployee(emp._id)}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="card" style={{ marginTop: "20px" }}>
            <h2>Assign Shift</h2>
            <form onSubmit={handleAssignShift}>
              <div className="form-group">
                <label>Select Staff</label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                >
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Day</label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Slot</label>
                <select
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                >
                  {SLOTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={employees.length === 0}
              >
                Assign Slot
              </button>
            </form>
          </div>
        </div>

        {/* Right Area: Calendar Grid */}
        <div className="card">
          <h2>Weekly Schedule</h2>
          <div className="calendar-grid">
            {DAYS.map((day) => (
              <div key={day} className="day-column">
                <div className="day-title">{day}</div>
                {SLOTS.map((slot) => {
                  const activeShifts = shifts.filter(
                    (s) => s.date === day && s.slot === slot
                  );

                  return (
                    <div key={slot} className="slot-block">
                      <div className="slot-header">{slot}</div>
                      {activeShifts.map((shift) => (
                        <div key={shift._id} className="shift-badge">
                          <span>{shift.employee_name}</span>
                          <button
                            className="btn-remove-shift"
                            onClick={() => handleDeleteShift(shift._id)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;