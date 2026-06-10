import { useState, useEffect, useCallback } from 'react';
import './App.css';

// Import icons
import {
  Home, FileText, Map, Users, Stethoscope, Plus, Edit, Trash2,
  Search, MapPin, Navigation, Filter, Calendar, Save, X,
  ChevronDown, AlertTriangle, CheckCircle, BarChart3, Download,
  RefreshCw, Upload, Settings, Menu, ChevronRight, Eye,
  Building2, Cross, Pill, Building, Hospital
} from 'lucide-react';

// Import utilities
import { getAppData, saveAppData, generateId, getDoctorRequiredVisits, getMonthName, formatDate } from './utils/storage';
import { checkGeofencingBreach, getCurrentPosition, calculateDistance } from './utils/geofencing';
import { generateSmartPlan, getDoctorsVisitStats } from './utils/planGenerator';

// ==================== MAIN APP ====================
function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [appData, setAppData] = useState(getAppData());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const refreshData = useCallback(() => {
    setAppData(getAppData());
  }, []);

  const updateData = useCallback((newData) => {
    saveAppData(newData);
    setAppData(newData);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: Home },
    { id: 'reports', label: 'محاكي التقارير', icon: FileText },
    { id: 'map', label: 'الخريطة', icon: Map },
    { id: 'doctors', label: 'الأطباء', icon: Stethoscope },
  ];

  return (
    <div className="app" dir="rtl">
      {/* Top Header */}
      <header className="app-header">
        <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Menu size={24} />
        </button>
        <div className="header-title">
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%234f46e5'/%3E%3Ctext x='50' y='60' text-anchor='middle' fill='white' font-size='30' font-family='Arial'%3EMR%3C/text%3E%3C/svg%3E" alt="Logo" className="header-logo" />
          <h1>Med Rep SFA Pro</h1>
          <span className="header-subtitle">مندوب الدعاية الطبية الذكي</span>
        </div>
      </header>

      {/* Navigation Bar */}
      <nav className="bottom-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-btn ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => setCurrentPage(item.id)}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {currentPage === 'dashboard' && <DashboardPage data={appData} onNavigate={setCurrentPage} />}
        {currentPage === 'reports' && <ReportSimulatorPage data={appData} updateData={updateData} refreshData={refreshData} />}
        {currentPage === 'map' && <MapPage data={appData} updateData={updateData} />}
        {currentPage === 'doctors' && <DoctorsPage data={appData} />}
      </main>
    </div>
  );
}

// ==================== DASHBOARD PAGE ====================
function DashboardPage({ data, onNavigate }) {
  const totalDoctors = data.doctors.length;
  const totalVisits = data.visits.length;
  const totalClients = data.clients.length;
  const thisMonthVisits = data.visits.filter(v => {
    const d = new Date(v.visitDate);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="dashboard-page">
      <h2 className="page-title">لوحة التحكم الرئيسية</h2>
      
      <div className="stats-grid">
        <div className="stat-card stat-blue" onClick={() => onNavigate('reports')}>
          <Stethoscope size={32} />
          <div className="stat-info">
            <span className="stat-number">{totalDoctors}</span>
            <span className="stat-label">الأطباء المسجلين</span>
          </div>
        </div>
        <div className="stat-card stat-green" onClick={() => onNavigate('reports')}>
          <FileText size={32} />
          <div className="stat-info">
            <span className="stat-number">{totalVisits}</span>
            <span className="stat-label">إجمالي الزيارات</span>
          </div>
        </div>
        <div className="stat-card stat-purple" onClick={() => onNavigate('reports')}>
          <Calendar size={32} />
          <div className="stat-info">
            <span className="stat-number">{thisMonthVisits}</span>
            <span className="stat-label">زيارات هذا الشهر</span>
          </div>
        </div>
        <div className="stat-card stat-orange" onClick={() => onNavigate('reports')}>
          <Building2 size={32} />
          <div className="stat-info">
            <span className="stat-number">{totalClients}</span>
            <span className="stat-label">العملاء</span>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>إجراءات سريعة</h3>
        <div className="actions-grid">
          <button className="action-btn" onClick={() => onNavigate('reports')}>
            <Plus size={24} />
            <span>تسجيل زيارة</span>
          </button>
          <button className="action-btn" onClick={() => onNavigate('map')}>
            <Map size={24} />
            <span>الخريطة</span>
          </button>
          <button className="action-btn" onClick={() => onNavigate('doctors')}>
            <BarChart3 size={24} />
            <span>إحصائيات الأطباء</span>
          </button>
        </div>
      </div>

      <div className="recent-visits">
        <h3>آخر الزيارات</h3>
        {data.visits.length === 0 ? (
          <p className="empty-state">لا توجد زيارات مسجلة بعد</p>
        ) : (
          <div className="visits-list">
            {data.visits.slice(-5).reverse().map(visit => (
              <div key={visit.id} className="visit-card-mini">
                <div className="visit-info">
                  <strong>{visit.doctorName}</strong>
                  <span className="visit-date">{formatDate(visit.visitDate)}</span>
                </div>
                <span className={`class-badge class-${visit.doctorClass}`}>{visit.doctorClass}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== REPORT SIMULATOR PAGE ====================
function ReportSimulatorPage({ data, updateData, refreshData }) {
  const [activeSection, setActiveSection] = useState('doctors');

  const sections = [
    { id: 'doctors', label: 'قائمة الأطباء', icon: Stethoscope },
    { id: 'clients', label: 'قائمة العملاء', icon: Building2 },
    { id: 'visits', label: 'سجل الزيارات', icon: FileText },
  ];

  return (
    <div className="report-page">
      <h2 className="page-title">محاكي التقارير</h2>
      
      <div className="section-tabs">
        {sections.map(sec => (
          <button
            key={sec.id}
            className={`section-tab ${activeSection === sec.id ? 'active' : ''}`}
            onClick={() => setActiveSection(sec.id)}
          >
            <sec.icon size={16} />
            <span>{sec.label}</span>
          </button>
        ))}
      </div>

      {activeSection === 'doctors' && <DoctorsSection data={data} updateData={updateData} />}
      {activeSection === 'clients' && <ClientsSection data={data} updateData={updateData} />}
      {activeSection === 'visits' && <VisitsSection data={data} updateData={updateData} />}
    </div>
  );
}

// ==================== DOCTORS SECTION ====================
function DoctorsSection({ data, updateData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDoctor, setNewDoctor] = useState({ name: '', speciality: 'طب عام', classRating: 'C', workplace1: '', workplace2: '', latitude: '', longitude: '' });

  // MODIFIED: Search by doctor name instead of workplace name
  const filteredDoctors = data.doctors.filter(doc => {
    const matchesSearch = !searchTerm || doc.name.includes(searchTerm);
    const matchesClass = !classFilter || doc.classRating === classFilter;
    return matchesSearch && matchesClass;
  });

  const handleAddDoctor = () => {
    if (!newDoctor.name.trim()) return;
    const doctor = {
      id: generateId('doc'),
      name: newDoctor.name.trim(),
      speciality: newDoctor.speciality,
      classRating: newDoctor.classRating,
      workplace1: newDoctor.workplace1.trim(),
      workplace2: newDoctor.workplace2.trim(),
      latitude: newDoctor.latitude ? parseFloat(newDoctor.latitude) : null,
      longitude: newDoctor.longitude ? parseFloat(newDoctor.longitude) : null,
    };
    const updatedData = { ...data, doctors: [...data.doctors, doctor] };
    updateData(updatedData);
    setNewDoctor({ name: '', speciality: 'طب عام', classRating: 'C', workplace1: '', workplace2: '', latitude: '', longitude: '' });
    setShowAddForm(false);
  };

  const handleUpdateDoctor = () => {
    if (!editingDoctor) return;
    const updatedDoctors = data.doctors.map(d => d.id === editingDoctor.id ? editingDoctor : d);
    updateData({ ...data, doctors: updatedDoctors });
    setEditingDoctor(null);
  };

  const handleUpdateGPS = async () => {
    try {
      const pos = await getCurrentPosition();
      setEditingDoctor(prev => ({
        ...prev,
        latitude: pos.latitude,
        longitude: pos.longitude
      }));
    } catch (err) {
      alert('خطأ في تحديد الموقع: ' + err.message);
    }
  };

  const handleDeleteDoctor = (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطبيب؟')) return;
    updateData({ ...data, doctors: data.doctors.filter(d => d.id !== id) });
  };

  return (
    <div className="section-content">
      {/* Filters */}
      <div className="filters-row">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="البحث باسم الطبيب..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="filter-select">
          <option value="">كل الكلاسات</option>
          <option value="A">كلاس A</option>
          <option value="B">كلاس B</option>
          <option value="C">كلاس C</option>
        </select>
        <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
          <Plus size={16} />
          إضافة طبيب
        </button>
      </div>

      {/* Doctors List */}
      <div className="items-list">
        {filteredDoctors.length === 0 ? (
          <div className="empty-state">
            <Stethoscope size={48} />
            <p>لا يوجد أطباء مسجلين</p>
          </div>
        ) : (
          filteredDoctors.map(doctor => (
            <div key={doctor.id} className="list-item">
              <div className="item-info">
                <div className="item-main">
                  <span className={`class-badge class-${doctor.classRating}`}>{doctor.classRating}</span>
                  <strong className="doctor-name">{doctor.name}</strong>
                </div>
                <div className="item-meta">
                  <span>{doctor.speciality}</span>
                  {doctor.workplace1 && <span>• {doctor.workplace1}</span>}
                  {doctor.latitude && <span className="gps-indicator"><MapPin size={12} /> GPS</span>}
                </div>
              </div>
              <div className="item-actions">
                <button className="btn btn-sm btn-outline" onClick={() => setEditingDoctor({ ...doctor })}>
                  <Edit size={14} />
                  تعديل
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDeleteDoctor(doctor.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Doctor Modal */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>إضافة طبيب جديد</h3>
              <button className="close-btn" onClick={() => setShowAddForm(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>اسم الطبيب</label>
                <input type="text" value={newDoctor.name} onChange={e => setNewDoctor(p => ({ ...p, name: e.target.value }))} placeholder="اسم الطبيب" />
              </div>
              <div className="form-group">
                <label>التخصص</label>
                <input type="text" value={newDoctor.speciality} onChange={e => setNewDoctor(p => ({ ...p, speciality: e.target.value }))} placeholder="التخصص" />
              </div>
              <div className="form-group">
                <label>كلاس الطبيب</label>
                <select value={newDoctor.classRating} onChange={e => setNewDoctor(p => ({ ...p, classRating: e.target.value }))}>
                  <option value="A">A - 4 زيارات شهرياً</option>
                  <option value="B">B - 3 زيارات شهرياً</option>
                  <option value="C">C - زيارة واحدة شهرياً</option>
                </select>
              </div>
              <div className="form-group">
                <label>مكان العمل 1</label>
                <input type="text" value={newDoctor.workplace1} onChange={e => setNewDoctor(p => ({ ...p, workplace1: e.target.value }))} placeholder="اسم العيادة أو المستشفى" />
              </div>
              <div className="form-group">
                <label>مكان العمل 2</label>
                <input type="text" value={newDoctor.workplace2} onChange={e => setNewDoctor(p => ({ ...p, workplace2: e.target.value }))} placeholder="اسم العيادة أو المستشفى" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleAddDoctor}>
                <Save size={16} />
                حفظ
              </button>
              <button className="btn btn-outline" onClick={() => setShowAddForm(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Doctor Modal */}
      {editingDoctor && (
        <div className="modal-overlay" onClick={() => setEditingDoctor(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>تعديل بيانات الطبيب</h3>
              <button className="close-btn" onClick={() => setEditingDoctor(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>اسم الطبيب</label>
                <input type="text" value={editingDoctor.name} onChange={e => setEditingDoctor(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>التخصص</label>
                <input type="text" value={editingDoctor.speciality} onChange={e => setEditingDoctor(p => ({ ...p, speciality: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>كلاس الطبيب</label>
                <select value={editingDoctor.classRating} onChange={e => setEditingDoctor(p => ({ ...p, classRating: e.target.value }))}>
                  <option value="A">A - 4 زيارات شهرياً</option>
                  <option value="B">B - 3 زيارات شهرياً</option>
                  <option value="C">C - زيارة واحدة شهرياً</option>
                </select>
              </div>
              <div className="form-group">
                <label>مكان العمل 1</label>
                <input type="text" value={editingDoctor.workplace1 || ''} onChange={e => setEditingDoctor(p => ({ ...p, workplace1: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>مكان العمل 2</label>
                <input type="text" value={editingDoctor.workplace2 || ''} onChange={e => setEditingDoctor(p => ({ ...p, workplace2: e.target.value }))} />
              </div>
              
              {/* GPS Location Update Section - NEW */}
              <div className="gps-section">
                <h4 className="gps-title">
                  <Navigation size={16} />
                  تحديث الموقع الجغرافي للطبيب
                </h4>
                <div className="gps-fields">
                  <div className="form-group">
                    <label>خط العرض (Latitude)</label>
                    <input type="text" value={editingDoctor.latitude || ''} readOnly className="gps-input" />
                  </div>
                  <div className="form-group">
                    <label>خط الطول (Longitude)</label>
                    <input type="text" value={editingDoctor.longitude || ''} readOnly className="gps-input" />
                  </div>
                </div>
                <button className="btn btn-gps" onClick={handleUpdateGPS}>
                  <MapPin size={16} />
                  تحديث الموقع الجغرافي
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleUpdateDoctor}>
                <Save size={16} />
                حفظ التعديلات
              </button>
              <button className="btn btn-outline" onClick={() => setEditingDoctor(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== CLIENTS SECTION ====================
function ClientsSection({ data, updateData }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [newClient, setNewClient] = useState({ type: 'مستشفى', name: '', address: '', latitude: '', longitude: '' });

  const clientTypes = ['مستشفى', 'مركز طبي', 'عيادة خاصة', 'صيدلية'];

  const filteredClients = data.clients.filter(c => !typeFilter || c.type === typeFilter);

  const handleAddClient = async () => {
    if (!newClient.name.trim()) return;
    let lat = newClient.latitude;
    let lon = newClient.longitude;
    
    const client = {
      id: generateId('client'),
      type: newClient.type,
      name: newClient.name.trim(),
      address: newClient.address.trim(),
      latitude: lat ? parseFloat(lat) : null,
      longitude: lon ? parseFloat(lon) : null,
    };
    updateData({ ...data, clients: [...data.clients, client] });
    setNewClient({ type: 'مستشفى', name: '', address: '', latitude: '', longitude: '' });
    setShowAddForm(false);
  };

  const handleUpdateClient = () => {
    if (!editingClient) return;
    const updated = data.clients.map(c => c.id === editingClient.id ? editingClient : c);
    updateData({ ...data, clients: updated });
    setEditingClient(null);
  };

  const handleUpdateClientGPS = async () => {
    try {
      const pos = await getCurrentPosition();
      setEditingClient(prev => ({
        ...prev,
        latitude: pos.latitude,
        longitude: pos.longitude
      }));
    } catch (err) {
      alert('خطأ في تحديد الموقع: ' + err.message);
    }
  };

  const handleNewClientGPS = async () => {
    try {
      const pos = await getCurrentPosition();
      setNewClient(prev => ({
        ...prev,
        latitude: pos.latitude.toString(),
        longitude: pos.longitude.toString()
      }));
    } catch (err) {
      alert('خطأ في تحديد الموقع: ' + err.message);
    }
  };

  const handleDeleteClient = (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا العميل؟')) return;
    updateData({ ...data, clients: data.clients.filter(c => c.id !== id) });
  };

  return (
    <div className="section-content">
      <div className="filters-row">
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="filter-select">
          <option value="">كل الأنواع</option>
          {clientTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
          <Plus size={16} />
          إضافة عميل جديد
        </button>
      </div>

      <div className="items-list">
        {filteredClients.length === 0 ? (
          <div className="empty-state">
            <Building2 size={48} />
            <p>لا يوجد عملاء مسجلين</p>
          </div>
        ) : (
          filteredClients.map(client => (
            <div key={client.id} className="list-item">
              <div className="item-info">
                <div className="item-main">
                  <span className={`type-badge type-${client.type}`}>
                    {client.type === 'مستشفى' && <Hospital size={14} />}
                    {client.type === 'مركز طبي' && <Building size={14} />}
                    {client.type === 'عيادة خاصة' && <Stethoscope size={14} />}
                    {client.type === 'صيدلية' && <Pill size={14} />}
                    {client.type}
                  </span>
                  <strong>{client.name}</strong>
                </div>
                <div className="item-meta">
                  {client.address && <span>{client.address}</span>}
                  {client.latitude && <span className="gps-indicator"><MapPin size={12} /> GPS</span>}
                </div>
              </div>
              <div className="item-actions">
                <button className="btn btn-sm btn-outline" onClick={() => setEditingClient({ ...client })}>
                  <Edit size={14} />
                  تعديل
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDeleteClient(client.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Client Modal */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>إضافة عميل جديد</h3>
              <button className="close-btn" onClick={() => setShowAddForm(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>نوع العميل</label>
                <select value={newClient.type} onChange={e => setNewClient(p => ({ ...p, type: e.target.value }))}>
                  {clientTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>اسم العميل</label>
                <input type="text" value={newClient.name} onChange={e => setNewClient(p => ({ ...p, name: e.target.value }))} placeholder="اسم العميل" />
              </div>
              <div className="form-group">
                <label>عنوان العميل</label>
                <input type="text" value={newClient.address} onChange={e => setNewClient(p => ({ ...p, address: e.target.value }))} placeholder="العنوان" />
              </div>
              <div className="gps-section">
                <h4 className="gps-title"><Navigation size={16} /> إحداثيات الموقع GPS</h4>
                <div className="gps-fields">
                  <div className="form-group">
                    <label>خط العرض</label>
                    <input type="text" value={newClient.latitude} readOnly className="gps-input" />
                  </div>
                  <div className="form-group">
                    <label>خط الطول</label>
                    <input type="text" value={newClient.longitude} readOnly className="gps-input" />
                  </div>
                </div>
                <button className="btn btn-gps" onClick={handleNewClientGPS}>
                  <MapPin size={16} />
                  تحديث الموقع الجغرافي
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleAddClient}><Save size={16} /> حفظ</button>
              <button className="btn btn-outline" onClick={() => setShowAddForm(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {editingClient && (
        <div className="modal-overlay" onClick={() => setEditingClient(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>تعديل بيانات العميل</h3>
              <button className="close-btn" onClick={() => setEditingClient(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>نوع العميل</label>
                <select value={editingClient.type} onChange={e => setEditingClient(p => ({ ...p, type: e.target.value }))}>
                  {clientTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>اسم العميل</label>
                <input type="text" value={editingClient.name} onChange={e => setEditingClient(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>عنوان العميل</label>
                <input type="text" value={editingClient.address || ''} onChange={e => setEditingClient(p => ({ ...p, address: e.target.value }))} />
              </div>
              <div className="gps-section">
                <h4 className="gps-title"><Navigation size={16} /> إحداثيات الموقع GPS</h4>
                <div className="gps-fields">
                  <div className="form-group">
                    <label>خط العرض</label>
                    <input type="text" value={editingClient.latitude || ''} readOnly className="gps-input" />
                  </div>
                  <div className="form-group">
                    <label>خط الطول</label>
                    <input type="text" value={editingClient.longitude || ''} readOnly className="gps-input" />
                  </div>
                </div>
                <button className="btn btn-gps" onClick={handleUpdateClientGPS}>
                  <MapPin size={16} />
                  تحديث الموقع الجغرافي
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleUpdateClient}><Save size={16} /> حفظ</button>
              <button className="btn btn-outline" onClick={() => setEditingClient(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== VISITS SECTION ====================
function VisitsSection({ data, updateData }) {
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [monthFilter, setMonthFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [visitForm, setVisitForm] = useState({
    doctorName: '', doctorClass: 'C', workplaceName: '', visitDate: '',
    notes: '', samples: [], latitude: null, longitude: null
  });
  const [geofenceResult, setGeofenceResult] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const filteredVisits = data.visits.filter(v => {
    const matchesMonth = !monthFilter || new Date(v.visitDate).getMonth() === parseInt(monthFilter);
    const matchesClass = !classFilter || v.doctorClass === classFilter;
    return matchesMonth && matchesClass;
  });

  const handleStartVisit = async () => {
    setGettingLocation(true);
    try {
      const pos = await getCurrentPosition();
      setVisitForm(prev => ({ ...prev, latitude: pos.latitude, longitude: pos.longitude }));
      
      // Check geofencing if doctor has archived location
      if (visitForm.doctorName) {
        const doctor = data.doctors.find(d => d.name === visitForm.doctorName);
        if (doctor && doctor.latitude && doctor.longitude) {
          const result = checkGeofencingBreach(doctor.latitude, doctor.longitude, pos.latitude, pos.longitude);
          setGeofenceResult(result);
        }
      }
    } catch (err) {
      setGeofenceResult({ isBreach: false, message: 'لم يتم تحديد الموقع' });
    }
    setGettingLocation(false);
    setShowVisitForm(true);
  };

  const handleSubmitVisit = () => {
    if (!visitForm.doctorName || !visitForm.visitDate) {
      alert('يرجى تعبئة الحقول المطلوبة');
      return;
    }

    const visit = {
      id: generateId('visit'),
      visitDate: visitForm.visitDate,
      clientType: 'Doctor',
      doctorName: visitForm.doctorName,
      doctorClass: visitForm.doctorClass,
      workplaceName: visitForm.workplaceName,
      latitude: visitForm.latitude,
      longitude: visitForm.longitude,
      samples: visitForm.samples,
      notes: visitForm.notes,
      geofenceBreach: geofenceResult?.isBreach || false,
      geofenceDistance: geofenceResult?.distance || null,
      checkInTime: new Date().toISOString(),
      checkOutTime: null,
    };

    updateData({ ...data, visits: [...data.visits, visit] });
    setShowVisitForm(false);
    setVisitForm({ doctorName: '', doctorClass: 'C', workplaceName: '', visitDate: '', notes: '', samples: [], latitude: null, longitude: null });
    setGeofenceResult(null);
  };

  const handleDeleteVisit = (id) => {
    if (!confirm('هل أنت متأكد من حذف هذه الزيارة؟')) return;
    updateData({ ...data, visits: data.visits.filter(v => v.id !== id) });
  };

  return (
    <div className="section-content">
      <div className="filters-row">
        <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="filter-select">
          <option value="">كل الأشهر</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i} value={i}>{getMonthName(i)}</option>
          ))}
        </select>
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="filter-select">
          <option value="">كل الكلاسات</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
        </select>
        <button className="btn btn-primary" onClick={handleStartVisit}>
          <Plus size={16} />
          تسجيل زيارة جديدة
        </button>
      </div>

      {/* Geofence Alert */}
      {geofenceResult && geofenceResult.isBreach && (
        <div className="alert alert-danger">
          <AlertTriangle size={20} />
          <span>{geofenceResult.message}</span>
        </div>
      )}
      {geofenceResult && !geofenceResult.isBreach && geofenceResult.distance !== null && (
        <div className="alert alert-success">
          <CheckCircle size={20} />
          <span>{geofenceResult.message}</span>
        </div>
      )}

      <div className="visits-grid">
        {filteredVisits.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <p>لا توجد زيارات مسجلة</p>
          </div>
        ) : (
          [...filteredVisits].reverse().map(visit => (
            <div key={visit.id} className={`visit-card ${visit.geofenceBreach ? 'breach' : ''}`}>
              <div className="visit-card-header">
                <div>
                  <strong>{visit.doctorName}</strong>
                  <span className={`class-badge class-${visit.doctorClass}`}>{visit.doctorClass}</span>
                </div>
                <span className="visit-date">{formatDate(visit.visitDate)}</span>
              </div>
              <div className="visit-card-body">
                {visit.workplaceName && <span className="visit-workplace">{visit.workplaceName}</span>}
                {visit.geofenceBreach && (
                  <span className="breach-badge">
                    <AlertTriangle size={12} />
                    خرق جيو-جغرافي ({visit.geofenceDistance?.toFixed(0)}م)
                  </span>
                )}
                {visit.notes && <p className="visit-notes">{visit.notes}</p>}
              </div>
              <div className="visit-card-footer">
                <button className="btn btn-sm btn-danger" onClick={() => handleDeleteVisit(visit.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Visit Form Modal */}
      {showVisitForm && (
        <div className="modal-overlay" onClick={() => setShowVisitForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>تسجيل زيارة جديدة</h3>
              <button className="close-btn" onClick={() => setShowVisitForm(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>اسم الطبيب *</label>
                <select value={visitForm.doctorName} onChange={e => {
                  const doc = data.doctors.find(d => d.name === e.target.value);
                  setVisitForm(prev => ({
                    ...prev,
                    doctorName: e.target.value,
                    doctorClass: doc?.classRating || 'C',
                    workplaceName: doc?.workplace1 || ''
                  }));
                }}>
                  <option value="">اختر الطبيب</option>
                  {data.doctors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>كلاس الطبيب</label>
                <select value={visitForm.doctorClass} onChange={e => setVisitForm(p => ({ ...p, doctorClass: e.target.value }))}>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>
              <div className="form-group">
                <label>مكان العمل</label>
                <input type="text" value={visitForm.workplaceName} onChange={e => setVisitForm(p => ({ ...p, workplaceName: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>تاريخ الزيارة *</label>
                <input type="date" value={visitForm.visitDate} onChange={e => setVisitForm(p => ({ ...p, visitDate: e.target.value }))} />
              </div>
              
              {/* Geofence Status */}
              {geofenceResult && (
                <div className={`geofence-status ${geofenceResult.isBreach ? 'breach' : 'ok'}`}>
                  {geofenceResult.isBreach ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                  <span>{geofenceResult.message}</span>
                </div>
              )}
              
              <div className="form-group">
                <label>ملاحظات</label>
                <textarea value={visitForm.notes} onChange={e => setVisitForm(p => ({ ...p, notes: e.target.value }))} placeholder="ملاحظات إضافية" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleSubmitVisit}><Save size={16} /> تسجيل الزيارة</button>
              <button className="btn btn-outline" onClick={() => setShowVisitForm(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== MAP PAGE ====================
function MapPage({ data, updateData }) {
  const [activeMapSection, setActiveMapSection] = useState('doctors');
  const [mapInstance, setMapInstance] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [smartPlan, setSmartPlan] = useState(null);
  const [showPlan, setShowPlan] = useState(false);

  useEffect(() => {
    // Load Leaflet CSS dynamically
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS dynamically
    const loadMap = () => {
      if (window.L && document.getElementById('map-container')) {
        initMap();
      } else {
        const existingScript = document.querySelector('script[src*="leaflet"]');
        if (!existingScript) {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = () => {
            setTimeout(() => initMap(), 100);
          };
          document.head.appendChild(script);
        } else {
          existingScript.onload = () => setTimeout(() => initMap(), 100);
        }
      }
    };

    const initMap = () => {
      const L = window.L;
      if (!L || !document.getElementById('map-container')) return;

      // Destroy existing map
      if (mapInstance) {
        mapInstance.remove();
      }

      const map = L.map('map-container').setView([15.5527, 48.5164], 6);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      if (activeMapSection === 'doctors') {
        // Show doctors on map with clustering
        const markers = [];
        data.doctors.forEach(doctor => {
          if (doctor.latitude && doctor.longitude) {
            const marker = L.circleMarker([doctor.latitude, doctor.longitude], {
              radius: 8,
              fillColor: doctor.classRating === 'A' ? '#ef4444' : doctor.classRating === 'B' ? '#f59e0b' : '#3b82f6',
              color: '#fff',
              weight: 2,
              fillOpacity: 0.8
            }).addTo(map);
            
            marker.bindPopup(`
              <div style="direction:rtl;text-align:right;font-family:Cairo,sans-serif">
                <strong>${doctor.name}</strong><br/>
                التخصص: ${doctor.speciality}<br/>
                الكلاس: ${doctor.classRating}<br/>
                ${doctor.workplace1 ? 'مكان العمل: ' + doctor.workplace1 : ''}
              </div>
            `);
            markers.push(marker);
          }
        });

        // Group nearby markers visually
        if (markers.length === 0) {
          map.setView([15.5527, 48.5164], 6);
        } else if (markers.length === 1) {
          // zoom to single marker
        }
      } else {
        // Show clients on map
        data.clients.forEach(client => {
          if (client.latitude && client.longitude) {
            const color = client.type === 'مستشفى' ? '#dc2626' : 
                          client.type === 'مركز طبي' ? '#2563eb' : 
                          client.type === 'عيادة خاصة' ? '#16a34a' : '#9333ea';
            
            const marker = L.circleMarker([client.latitude, client.longitude], {
              radius: 10,
              fillColor: color,
              color: '#fff',
              weight: 2,
              fillOpacity: 0.8
            }).addTo(map);
            
            // Find doctors working at this client
            const doctorsHere = data.doctors.filter(d => 
              d.workplace1 === client.name || d.workplace2 === client.name
            );
            
            let popupContent = `
              <div style="direction:rtl;text-align:right;font-family:Cairo,sans-serif">
                <strong>${client.name}</strong><br/>
                النوع: ${client.type}<br/>
                ${client.address ? 'العنوان: ' + client.address + '<br/>' : ''}
            `;
            
            if (doctorsHere.length > 0) {
              popupContent += `<hr/><strong>الأطباء العاملون:</strong><br/>`;
              doctorsHere.forEach(d => {
                popupContent += `• ${d.name} (${d.speciality}) - كلاس ${d.classRating}<br/>`;
              });
            }
            popupContent += '</div>';
            
            marker.bindPopup(popupContent);
          }
        });
      }

      setMapInstance(map);
      setTimeout(() => map.invalidateSize(), 200);
    };

    // Small delay to ensure container is rendered
    const timer = setTimeout(loadMap, 300);
    return () => clearTimeout(timer);
  }, [activeMapSection, data]);

  const handleGeneratePlan = () => {
    const now = new Date();
    const plan = generateSmartPlan(now.getFullYear(), now.getMonth());
    setSmartPlan(plan);
    setShowPlan(true);
  };

  return (
    <div className="map-page">
      <h2 className="page-title">الخريطة</h2>
      
      <div className="map-section-tabs">
        <button className={`section-tab ${activeMapSection === 'doctors' ? 'active' : ''}`} onClick={() => setActiveMapSection('doctors')}>
          <Stethoscope size={16} />
          <span>الأطباء</span>
        </button>
        <button className={`section-tab ${activeMapSection === 'clients' ? 'active' : ''}`} onClick={() => setActiveMapSection('clients')}>
          <Building2 size={16} />
          <span>المستشفيات والمراكز الطبية</span>
        </button>
      </div>

      {activeMapSection === 'doctors' && (
        <div className="map-actions">
          <button className="btn btn-primary btn-block" onClick={handleGeneratePlan}>
            <Calendar size={16} />
            إنشاء الخطة الشهرية الذكية
          </button>
        </div>
      )}

      <div id="map-container" className="map-container"></div>

      {/* Map Legend */}
      <div className="map-legend">
        {activeMapSection === 'doctors' ? (
          <>
            <div className="legend-item"><span className="legend-dot" style={{background:'#ef4444'}}></span> كلاس A</div>
            <div className="legend-item"><span className="legend-dot" style={{background:'#f59e0b'}}></span> كلاس B</div>
            <div className="legend-item"><span className="legend-dot" style={{background:'#3b82f6'}}></span> كلاس C</div>
          </>
        ) : (
          <>
            <div className="legend-item"><span className="legend-dot" style={{background:'#dc2626'}}></span> مستشفى</div>
            <div className="legend-item"><span className="legend-dot" style={{background:'#2563eb'}}></span> مركز طبي</div>
            <div className="legend-item"><span className="legend-dot" style={{background:'#16a34a'}}></span> عيادة خاصة</div>
            <div className="legend-item"><span className="legend-dot" style={{background:'#9333ea'}}></span> صيدلية</div>
          </>
        )}
      </div>

      {/* Smart Plan Modal */}
      {showPlan && smartPlan && (
        <div className="modal-overlay" onClick={() => setShowPlan(false)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>الخطة الشهرية الذكية - {smartPlan.summary.month} {smartPlan.summary.year}</h3>
              <button className="close-btn" onClick={() => setShowPlan(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="plan-summary">
                <div className="plan-stat">
                  <span className="plan-stat-number">{smartPlan.summary.totalDoctors}</span>
                  <span className="plan-stat-label">طبيب يحتاج زيارة</span>
                </div>
                <div className="plan-stat">
                  <span className="plan-stat-number">{smartPlan.summary.totalVisitsPlanned}</span>
                  <span className="plan-stat-label">زيارة مخططة</span>
                </div>
                <div className="plan-stat">
                  <span className="plan-stat-number">{smartPlan.summary.classA}</span>
                  <span className="plan-stat-label">كلاس A</span>
                </div>
                <div className="plan-stat">
                  <span className="plan-stat-number">{smartPlan.summary.classB}</span>
                  <span className="plan-stat-label">كلاس B</span>
                </div>
                <div className="plan-stat">
                  <span className="plan-stat-number">{smartPlan.summary.classC}</span>
                  <span className="plan-stat-label">كلاس C</span>
                </div>
                <div className="plan-stat">
                  <span className="plan-stat-number">{smartPlan.summary.workingDays}</span>
                  <span className="plan-stat-label">يوم عمل</span>
                </div>
              </div>

              <div className="plan-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>الطبيب</th>
                      <th>الكلاس</th>
                      <th>مكان العمل</th>
                      <th>التاريخ المخطط</th>
                    </tr>
                  </thead>
                  <tbody>
                    {smartPlan.plan.map((item, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>{item.doctorName}</td>
                        <td><span className={`class-badge class-${item.doctorClass}`}>{item.doctorClass}</span></td>
                        <td>{item.workplace}</td>
                        <td>{item.plannedDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowPlan(false)}>إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== DOCTORS PAGE ====================
function DoctorsPage({ data }) {
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth().toString());
  const [nameSearch, setNameSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [year] = useState(new Date().getFullYear());

  const monthNum = parseInt(monthFilter);
  const stats = getDoctorsVisitStats(year, monthNum);

  const filteredStats = stats.filter(s => {
    const matchesName = !nameSearch || s.name.includes(nameSearch);
    const matchesClass = !classFilter || s.classRating === classFilter;
    return matchesName && matchesClass;
  });

  return (
    <div className="doctors-page">
      <h2 className="page-title">الأطباء</h2>
      
      {/* Filters */}
      <div className="doctors-filters">
        <div className="filter-group">
          <label>الشهر</label>
          <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>{getMonthName(i)}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>اسم الطبيب</label>
          <input type="text" value={nameSearch} onChange={e => setNameSearch(e.target.value)} placeholder="بحث..." />
        </div>
        <div className="filter-group">
          <label>كلاس الطبيب</label>
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)}>
            <option value="">الكل</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </div>
        <div className="filter-group">
          <label>من تاريخ</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div className="filter-group">
          <label>إلى تاريخ</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="doctors-summary">
        <div className="summary-card">
          <span className="summary-number">{filteredStats.length}</span>
          <span className="summary-label">إجمالي الأطباء</span>
        </div>
        <div className="summary-card">
          <span className="summary-number">{filteredStats.reduce((s, d) => s + d.completedVisits, 0)}</span>
          <span className="summary-label">زيارات منجزة</span>
        </div>
        <div className="summary-card">
          <span className="summary-number">{filteredStats.reduce((s, d) => s + d.totalVisits, 0)}</span>
          <span className="summary-label">إجمالي الزيارات</span>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>اسم الطبيب</th>
              <th>التخصص</th>
              <th>كلاس الطبيب</th>
              <th>الزيارات المطلوبة شهرياً</th>
              <th>الزيارات المنجزة ({getMonthName(monthNum)})</th>
              <th>إجمالي الزيارات</th>
              <th>نسبة الإنجاز</th>
            </tr>
          </thead>
          <tbody>
            {filteredStats.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-cell">لا يوجد أطباء مسجلين</td>
              </tr>
            ) : (
              filteredStats.map((doctor, idx) => (
                <tr key={doctor.id}>
                  <td>{idx + 1}</td>
                  <td><strong>{doctor.name}</strong></td>
                  <td>{doctor.speciality}</td>
                  <td><span className={`class-badge class-${doctor.classRating}`}>{doctor.classRating}</span></td>
                  <td className="text-center">{doctor.requiredVisits}</td>
                  <td className="text-center">{doctor.completedVisits}</td>
                  <td className="text-center">{doctor.totalVisits}</td>
                  <td className="text-center">
                    <div className="progress-bar-wrapper">
                      <div className="progress-bar" style={{ width: `${Math.min(doctor.completionRate, 100)}%`, background: doctor.completionRate >= 100 ? '#22c55e' : doctor.completionRate >= 50 ? '#f59e0b' : '#ef4444' }}></div>
                      <span className="progress-text">{doctor.completionRate}%</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
