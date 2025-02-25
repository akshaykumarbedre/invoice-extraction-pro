import React, { useState, useEffect } from 'react';
import { Download, Save } from 'lucide-react';

const EditableResultsTable = ({ results, jobId, onUpdate }) => {
  const [editedData, setEditedData] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (results) {
      setEditedData(results);
    }
  }, [results]);

  const handleCellEdit = (rowIndex, columnName, value) => {
    setIsEditing(true);
    const newData = [...editedData];
    newData[rowIndex] = {
      ...newData[rowIndex],
      [columnName]: value
    };
    setEditedData(newData);
  };

  const handleSaveChanges = async () => {
    try {
      const response = await fetch('http://localhost:5000/update_results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          results: editedData
        })
      });

      if (response.ok) {
        setIsEditing(false);
        if (onUpdate) {
          onUpdate(editedData);
        }
      }
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  };

  const downloadExcel = () => {
    if (jobId) {
      window.location.href = `http://localhost:5000/download_excel/${jobId}`;
    }
  };

  if (!results || results.length === 0) {
    return null;
  }

  const columns = Object.keys(results[0]).filter(key => key !== 'error');

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
      <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="font-medium text-gray-800">Results</h2>
          <p className="text-xs text-gray-500">Click on cells to edit values</p>
        </div>
        <div className="flex gap-2">
          {isEditing && (
            <button
              onClick={handleSaveChanges}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white py-2 px-4 rounded-lg text-sm"
            >
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </button>
          )}
          <button
            onClick={downloadExcel}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 transition-colors text-white py-2 px-4 rounded-lg text-sm"
          >
            <Download className="h-4 w-4" />
            <span>Download Excel</span>
          </button>
        </div>
      </div>

      <div className="p-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {editedData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column) => (
                  <td
                    key={`${rowIndex}-${column}`}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    <input
                      type="text"
                      value={row[column] || ''}
                      onChange={(e) => handleCellEdit(rowIndex, column, e.target.value)}
                      className="w-full border-0 bg-transparent focus:ring-2 focus:ring-indigo-500 rounded p-1"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EditableResultsTable;