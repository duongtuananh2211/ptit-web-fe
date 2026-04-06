import React, { useEffect, useState } from 'react';
import { getUsers } from '../services/mockData';
import UserRow from '../components/UserRow';

const Admin: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    getUsers().then(setUsers);
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-on-surface editorial-tight">User Administration</h2>
          <p className="text-on-surface-variant mt-1">Manage system access, roles, and security permissions.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2 primary-gradient text-on-primary rounded-xl font-bold shadow-lg hover:scale-102 active:scale-98 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">person_add</span>
            Add User
          </button>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-surface-container-lowest rounded-2xl border border-slate-100/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="px-6 py-4 text-xs font-bold label-wide text-secondary">User Information</th>
                <th className="px-6 py-4 text-xs font-bold label-wide text-secondary">Role & Team</th>
                <th className="px-6 py-4 text-xs font-bold label-wide text-secondary">Access Level</th>
                <th className="px-6 py-4 text-xs font-bold label-wide text-secondary">Activity</th>
                <th className="px-6 py-4 text-xs font-bold label-wide text-secondary text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <UserRow key={user.id} user={user} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;
