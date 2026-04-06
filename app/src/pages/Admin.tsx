import React, { useEffect, useState } from 'react';
import { getUsers } from '../services/mockData';

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
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover shadow-sm" alt={user.name} />
                        <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-white rounded-full ${user.status === 'Active Now' ? 'bg-[#28A745]' : 'bg-outline'}`}></div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface">{user.name}</p>
                        <p className="text-xs text-on-surface-variant">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-semibold text-on-surface">{user.role}</p>
                    <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">Engineering Team</p>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2 py-1 ${user.access === 'Super Admin' ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-surface-container-highest text-on-surface-variant'} rounded-md text-[10px] font-black uppercase tracking-widest`}>
                      {user.access}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 w-16 bg-surface-container-low rounded-full overflow-hidden">
                        <div className={`h-full ${user.activity === 'High' ? 'bg-primary' : user.activity === 'Medium' ? 'bg-secondary' : 'bg-outline'} rounded-full`} style={{ width: user.activity === 'High' ? '80%' : user.activity === 'Medium' ? '45%' : '15%' }}></div>
                      </div>
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase">{user.activity}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 text-outline hover:text-primary hover:bg-white rounded-lg transition-all">
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button className="p-2 text-outline hover:text-error hover:bg-white rounded-lg transition-all ml-1">
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;
