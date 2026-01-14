
import React, { useState, useMemo } from 'react';
import { Project, Lead, User, Role, UserRole, KanbanColumn, TaskCard, LeadComment } from '../types';

interface ProjectManagementProps {
  projects: Project[];
  leads: Lead[];
  users: User[];
  roles: Role[];
  currentUser: User;
  onUpdateProject: (project: Project) => void;
}

const ProjectManagement: React.FC<ProjectManagementProps> = ({
  projects, leads, users, roles, currentUser, onUpdateProject
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<{ projectId: string; columnId: string; cardId: string } | null>(null);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [draggedCardInfo, setDraggedCardInfo] = useState<{ cardId: string; fromColId: string } | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  const currentUserRole = roles.find(r => r.id === currentUser?.customRoleId);
  const isPM = currentUserRole?.name.toLowerCase().includes('pm') || currentUserRole?.name.toLowerCase().includes('project manager');
  const isAdmin = currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.COMPANY_ADMIN;

  const tenantProjects = useMemo(() => {
    return projects.filter(p => {
      if (isAdmin) return p.tenantId === currentUser?.tenantId || currentUser?.role === UserRole.SUPER_ADMIN;
      const lead = leads.find(l => l.id === p.clientId);
      if (!lead) return false;
      if (isPM) return lead.projectManagerAssignedTo === currentUser?.id;
      return p.tenantId === currentUser?.tenantId;
    });
  }, [projects, leads, isAdmin, isPM, currentUser]);

  const activeProject = tenantProjects.find(p => p.id === selectedProjectId);
  const activeClient = leads.find(l => l.id === activeProject?.clientId);

  // Column Actions
  const handleAddColumn = () => {
    if (!activeProject || !newColumnTitle.trim()) return;
    const updated = {
      ...activeProject,
      columns: [...activeProject.columns, { id: `col-${Date.now()}`, title: newColumnTitle, cards: [] }]
    };
    onUpdateProject(updated);
    setNewColumnTitle('');
  };

  const handleDeleteColumn = (colId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeProject || !confirm('Delete this stage? All tasks will be lost.')) return;
    const updated = {
      ...activeProject,
      columns: activeProject.columns.filter(c => c.id !== colId)
    };
    onUpdateProject(updated);
  };

  const handleRenameColumn = (colId: string) => {
    if (!activeProject) return;
    const newTitle = prompt('New Stage Title:');
    if (!newTitle) return;
    const updated = {
      ...activeProject,
      columns: activeProject.columns.map(c => c.id === colId ? { ...c, title: newTitle } : c)
    };
    onUpdateProject(updated);
  };

  // Task Actions
  const handleAddTask = (columnId: string) => {
    if (!activeProject) return;
    const title = prompt('Task Title:');
    if (!title) return;

    const newCard: TaskCard = {
      id: `task-${Date.now()}`,
      title,
      description: '',
      priority: 'Medium',
      assignedTo: isPM ? currentUser.id : null,
      comments: [],
      files: [],
      createdAt: new Date().toISOString()
    };

    const updated = {
      ...activeProject,
      columns: activeProject.columns.map(col => col.id === columnId ? { ...col, cards: [...col.cards, newCard] } : col)
    };
    onUpdateProject(updated);
  };

  // Drag & Drop Handlers
  const onDragStart = (cardId: string, fromColId: string) => {
    setDraggedCardInfo({ cardId, fromColId });
  };

  const onDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragOverColId(colId);
  };

  const onDrop = (toColId: string) => {
    if (!draggedCardInfo || !activeProject) return;
    const { cardId, fromColId } = draggedCardInfo;
    if (fromColId === toColId) {
      setDraggedCardInfo(null);
      setDragOverColId(null);
      return;
    }

    const card = activeProject.columns.find(c => c.id === fromColId)?.cards.find(t => t.id === cardId);
    if (!card) return;

    const updated = {
      ...activeProject,
      columns: activeProject.columns.map(col => {
        if (col.id === fromColId) return { ...col, cards: col.cards.filter(t => t.id !== cardId) };
        if (col.id === toColId) return { ...col, cards: [...col.cards, card] };
        return col;
      }),
      lastUpdated: new Date().toISOString()
    };
    onUpdateProject(updated);
    setDraggedCardInfo(null);
    setDragOverColId(null);
  };

  // Comment Actions
  const handleAddComment = () => {
    if (!newComment.trim() || !editingCard || !activeProject) return;
    const { columnId, cardId } = editingCard;
    
    const comment: LeadComment = {
      id: `tc-${Date.now()}`,
      text: newComment,
      authorName: currentUser.name,
      timestamp: new Date().toISOString()
    };

    const updated = {
      ...activeProject,
      columns: activeProject.columns.map(c => 
        c.id === columnId 
          ? { ...c, cards: c.cards.map(t => t.id === cardId ? { ...t, comments: [...(t.comments || []), comment] } : t) } 
          : c
      )
    };

    onUpdateProject(updated);
    setNewComment('');
  };

  const renderCardDetails = () => {
    if (!editingCard || !activeProject) return null;
    const column = activeProject.columns.find(c => c.id === editingCard.columnId);
    const card = column?.cards.find(t => t.id === editingCard.cardId);
    if (!card) return null;

    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
           <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <button onClick={() => setEditingCard(null)} className="mb-4 text-slate-400 font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:text-slate-800 transition-colors">✕ Close Inspector</button>
                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">{card.title}</h3>
              </div>
              <div className="flex gap-4">
                 <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${card.priority === 'High' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>{card.priority} Priority</span>
                 <span className="bg-blue-50 text-blue-600 text-[9px] font-black px-4 py-2 rounded-xl border border-blue-100 uppercase tracking-widest">{column?.title}</span>
              </div>
           </div>

           <div className="flex-1 overflow-y-auto p-10 space-y-12">
              <div>
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Task Context & Objectives</label>
                 <textarea value={card.description} onChange={(e) => {
                   const val = e.target.value;
                   onUpdateProject({
                     ...activeProject,
                     columns: activeProject.columns.map(c => c.id === column?.id ? { ...c, cards: c.cards.map(t => t.id === card.id ? { ...t, description: val } : t) } : c)
                   });
                 }} className="w-full bg-slate-50 border-none rounded-[2rem] p-8 font-medium text-slate-600 outline-none h-48 resize-none focus:ring-4 focus:ring-primary/10 transition-all shadow-inner" placeholder="Detail the execution steps and operational requirements..." />
              </div>

              <div className="space-y-6">
                 <h5 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                   <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> Internal Ops Log
                 </h5>
                 
                 <div className="space-y-6">
                    {card.comments && card.comments.length > 0 ? card.comments.slice().reverse().map(comment => (
                      <div key={comment.id} className="flex gap-5 items-start">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0 shadow-lg">{comment.authorName.charAt(0)}</div>
                        <div className="flex-1 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                           <div className="flex justify-between items-center mb-2">
                              <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{comment.authorName}</span>
                              <span className="text-[9px] text-slate-400 font-bold">{new Date(comment.timestamp).toLocaleString()}</span>
                           </div>
                           <p className="text-sm text-slate-600 font-medium leading-relaxed">{comment.text}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-3xl opacity-30">
                         <p className="text-[10px] font-black uppercase tracking-widest">No communications recorded for this node</p>
                      </div>
                    )}
                 </div>
              </div>
           </div>

           <div className="p-8 border-t border-slate-100 bg-white">
              <form onSubmit={(e) => { e.preventDefault(); handleAddComment(); }} className="flex gap-4">
                 <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Append operational update note..." className="flex-1 px-8 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-medium focus:ring-4 focus:ring-primary/10 transition-all" />
                 <button type="submit" disabled={!newComment.trim()} className="bg-primary text-white px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">Post Log</button>
              </form>
           </div>
        </div>
      </div>
    );
  };

  const renderBoard = () => (
    <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="flex justify-between items-center mb-10 px-4">
          <div className="flex items-center gap-6">
             <button onClick={() => setSelectedProjectId(null)} className="p-3 bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-primary transition-all shadow-sm active:scale-95">←</button>
             <div>
                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">{activeClient?.name}</h3>
                <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest mt-1 opacity-70">{activeClient?.email} • {activeClient?.saleRecord?.packageTitle}</p>
             </div>
          </div>
          <div className="flex gap-4">
             <div className="flex bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                <input type="text" value={newColumnTitle} onChange={e => setNewColumnTitle(e.target.value)} placeholder="New Operations Stage..." className="px-6 py-2 outline-none text-[10px] font-black uppercase tracking-widest bg-transparent w-48" />
                <button onClick={handleAddColumn} className="bg-primary text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95">Provision Stage</button>
             </div>
          </div>
       </div>

       <div className="flex-1 flex gap-8 overflow-x-auto pb-8 px-4 custom-scrollbar items-start">
          {activeProject?.columns.map(col => (
            <div 
              key={col.id} 
              onDragOver={(e) => onDragOver(e, col.id)}
              onDragLeave={() => setDragOverColId(null)}
              onDrop={() => onDrop(col.id)}
              className={`w-[360px] flex-shrink-0 flex flex-col bg-slate-50/50 rounded-[2.5rem] p-6 border-2 transition-all duration-300 ${dragOverColId === col.id ? 'border-dashed border-primary bg-primary/5 scale-[1.02]' : 'border-transparent'}`}
            >
               <div className="flex justify-between items-center mb-6 px-4 group/col">
                  <div className="flex items-center gap-3">
                    <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">{col.title}</h4>
                    <span className="bg-white px-2.5 py-1 rounded-lg text-[9px] font-black text-slate-400 border border-slate-100 shadow-sm">{col.cards.length}</span>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover/col:opacity-100 transition-opacity">
                     <button onClick={() => handleRenameColumn(col.id)} className="text-[10px] hover:text-primary">✎</button>
                     <button onClick={(e) => handleDeleteColumn(col.id, e)} className="text-[10px] hover:text-rose-500">✕</button>
                  </div>
               </div>
               
               <div className="space-y-4 min-h-[100px]">
                  {col.cards.map(card => (
                    <div 
                      key={card.id} 
                      draggable
                      onDragStart={() => onDragStart(card.id, col.id)}
                      onClick={() => setEditingCard({ projectId: activeProject.id, columnId: col.id, cardId: card.id })} 
                      className={`bg-white p-7 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all cursor-grab active:cursor-grabbing group relative ${draggedCardInfo?.cardId === card.id ? 'opacity-30' : 'opacity-100'}`}
                    >
                       <div className="flex justify-between items-start mb-4">
                          <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-lg ${card.priority === 'High' ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'}`}>{card.priority}</span>
                          <span className="text-[10px] opacity-20 group-hover:opacity-100 transition-opacity">⋮⋮</span>
                       </div>
                       <h5 className="font-black text-slate-800 uppercase tracking-tight text-sm leading-tight group-hover:text-primary transition-colors">{card.title}</h5>
                       
                       <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
                          <div className="flex -space-x-2">
                             <div className="w-7 h-7 rounded-lg bg-slate-900 text-white text-[8px] font-black flex items-center justify-center border-2 border-white shadow-sm">{card.assignedTo ? users.find(u => u.id === card.assignedTo)?.name.charAt(0) : '?'}</div>
                          </div>
                          <div className="flex items-center gap-3">
                             <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">💬 {card.comments?.length || 0}</span>
                             <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">📎 {card.files?.length || 0}</span>
                          </div>
                       </div>
                    </div>
                  ))}
                  
                  <button onClick={() => handleAddTask(col.id)} className="w-full py-5 border-2 border-dashed border-slate-200 rounded-3xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-primary hover:text-primary hover:bg-white transition-all">Provision Task +</button>
               </div>
            </div>
          ))}
       </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col">
      {selectedProjectId ? renderBoard() : (
        <div className="space-y-10 animate-in fade-in duration-700">
           <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
              <div>
                 <h3 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">Ops Command Center</h3>
                 <p className="text-slate-500 font-medium mt-2">Managing {tenantProjects.length} active delivery pipelines</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {tenantProjects.map(project => {
                const client = leads.find(l => l.id === project.clientId);
                const pm = users.find(u => u.id === client?.projectManagerAssignedTo);
                
                return (
                  <div key={project.id} onClick={() => setSelectedProjectId(project.id)} className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group flex flex-col justify-between h-[360px]">
                     <div>
                        <div className="flex justify-between items-start mb-10">
                           <div className="w-16 h-16 rounded-[1.8rem] bg-indigo-50 text-indigo-600 flex items-center justify-center text-3xl font-black shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all duration-700">
                              {client?.name.charAt(0)}
                           </div>
                           <span className="bg-indigo-50 text-indigo-600 text-[8px] font-black px-4 py-1.5 rounded-full border border-indigo-100 uppercase tracking-widest">Active Ops</span>
                        </div>
                        <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2 group-hover:text-indigo-600 transition-colors">{client?.name}</h4>
                        <div className="space-y-1">
                           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{client?.saleRecord?.packageTitle}</p>
                           <p className="text-[10px] text-slate-400 font-bold">{client?.email}</p>
                        </div>
                     </div>

                     <div className="pt-8 border-t border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white text-[10px] font-black shadow-lg">
                              {pm?.name.charAt(0) || '?'}
                           </div>
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight truncate max-w-[100px]">{pm?.name || 'Awaiting PM'}</span>
                        </div>
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-4 py-2 rounded-xl">Launch Board →</span>
                     </div>
                  </div>
                );
              })}
              {tenantProjects.length === 0 && (
                <div className="col-span-full py-40 bg-slate-50 rounded-[4rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center opacity-40">
                   <span className="text-7xl mb-6">🏗️</span>
                   <p className="font-black uppercase text-xs tracking-widest">No active delivery nodes initialized</p>
                </div>
              )}
           </div>
        </div>
      )}
      {renderCardDetails()}
    </div>
  );
};

export default ProjectManagement;
