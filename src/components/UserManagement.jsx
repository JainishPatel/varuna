import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../config/rbacConfig';
import { Users, Plus, Trash2, Shield, AlertCircle, CheckCircle2, X, UserPlus, Edit3 } from 'lucide-react';

export default function UserManagement() {
  const { users, register, updateUserRole, deleteUser, currentUser } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('viewer');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await register(newUsername, newPassword, newRole, newDisplayName);
      setSuccess(`User "${newUsername}" created successfully`);
      setNewUsername('');
      setNewPassword('');
      setNewRole('viewer');
      setNewDisplayName('');
      setShowAddForm(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRoleChange = (userId, newRole) => {
    try {
      updateUserRole(userId, newRole);
      setEditingUserId(null);
      setSuccess('Role updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = (userId) => {
    try {
      deleteUser(userId);
      setSuccess('User deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 animate-fadeInUp">
      {/* Title Header */}
      <div className="v-card p-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
            <Users className="w-5 h-5 text-emerald-700" />
            User Management & Role Permissions
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage user accounts, assign role permissions, and control simulation/export access for Varuna
          </p>
        </div>
        <button
          id="add-user-btn"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          {showAddForm ? 'Cancel' : 'Add User'}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 text-rose-700 text-xs bg-rose-50 border border-rose-200 rounded-lg px-4 py-3 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-emerald-700 text-xs bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {success}
        </div>
      )}

      {/* Add User Form */}
      {showAddForm && (
        <form onSubmit={handleAddUser} className="v-card p-5 flex flex-col gap-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-emerald-700" />
            Create New User Account
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-600">Username</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="e.g. john_doe"
                className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-600">Display Name</label>
              <input
                type="text"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="e.g. John Doe"
                className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-600">Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-600">Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                {Object.entries(ROLES).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Create User
            </button>
          </div>
        </form>
      )}

      {/* Role Legend Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Object.entries(ROLES).map(([key, config]) => (
          <div key={key} className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.color }} />
              <span className="text-xs font-bold text-slate-900">{config.label}</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">{config.description}</p>
          </div>
        ))}
      </div>

      {/* High Density Users Table */}
      <div className="v-card overflow-hidden">
        <table className="density-table">
          <thead>
            <tr>
              <th>User Details</th>
              <th>Role</th>
              <th>Created Date</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const roleConfig = ROLES[user.role] || ROLES.viewer;
              const isCurrentUser = currentUser && currentUser.id === user.id;
              const isEditing = editingUserId === user.id;

              return (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
                        style={{ backgroundColor: roleConfig.color }}
                      >
                        {user.username[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {user.displayName}
                          {isCurrentUser && <span className="text-[10px] text-emerald-700 ml-2 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">You</span>}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">@{user.username}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {isEditing ? (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        onBlur={() => setEditingUserId(null)}
                        autoFocus
                        className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 focus:outline-none"
                      >
                        {Object.entries(ROLES).map(([key, config]) => (
                          <option key={key} value={key}>{config.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded border"
                        style={{ color: roleConfig.color, backgroundColor: roleConfig.bgColor, borderColor: roleConfig.borderColor }}
                      >
                        <Shield className="w-3 h-3" />
                        {roleConfig.shortLabel}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="text-xs text-slate-600 font-mono">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!isCurrentUser && (
                        <>
                          <button
                            onClick={() => setEditingUserId(user.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                            title="Edit role"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-700 transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
