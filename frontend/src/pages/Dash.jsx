import React, { useState, useEffect } from 'react';

export default function Dashboard() {
  const [logs, setLogs] = useState([]);

const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/test.php');
      const text = await response.text(); // Read raw text first

      try {
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
          setLogs(data);
        } else {
          console.error('Server returned an error object:', data);
        }
      } catch (jsonErr) {
        // Log the actual HTML error string sent by PHP
        console.error('PHP Outputted HTML instead of JSON:', text);
      }
    } catch (error) {
      console.error('Network or Fetch Error:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Polling every 5s
    return () => clearInterval(interval);
  }, []);

  const latest = logs[0] || {};

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Automated Hydroponic Dosing Controller</h2>
      
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
          <h3>pH Level</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {latest.ph_level ? parseFloat(latest.ph_level).toFixed(2) : '--'}
          </p>
        </div>
        
        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
          <h3>Water Level</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {latest.water_level ? `${parseFloat(latest.water_level).toFixed(1)}%` : '--'}
          </p>
        </div>

        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
          <h3>Dosing Relay</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: latest.solenoid_status === 'ON' ? 'green' : 'red' }}>
            {latest.solenoid_status || 'OFF'}
          </p>
        </div>
      </div>

      <h3>Recent History</h3>
      <table border="1" cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>pH Level</th>
            <th>Water Level</th>
            <th>Relay Status</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{new Date(log.recorded_at).toLocaleString()}</td>
              <td>{log.ph_level}</td>
              <td>{log.water_level}%</td>
              <td>{log.solenoid_status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}