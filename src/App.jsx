// @ts-nocheck
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import {
  Folder,
  FileText,
  Upload,
  Search,
  Filter,
  Calendar,
  LayoutDashboard,
  X,
  Eye,
  Clock,
  Download,
  Users,
  AlertCircle,
  Map,
  CalendarDays,
  Layers,
  MapPin,
  CheckCircle2,
  RefreshCw,
  LayoutGrid,
  List,
  Lock,
  LogOut,
  Trash2,
  ShieldAlert,
  Loader2,
  Bell,
  FileSpreadsheet,
  Maximize,
  User,
  Award,
  School,
  Activity,
  Database,
  Edit3,
  Plus,
  Mail,
  Moon,
  Sun,
  Pin,
  CheckSquare,
  Square,
  ArrowUpDown,
} from 'lucide-react';

// --- FIREBASE SETUP ---
const firebaseConfig = {
  apiKey: 'AIzaSyD_iUij1-zW_V5xCGUd_A4rbCvguY--72Q',
  authDomain: 'archivo-comision.firebaseapp.com',
  projectId: 'archivo-comision',
  storageBucket: 'archivo-comision.firebasestorage.app',
  messagingSenderId: '209272301506',
  appId: '1:209272301506:web:d3c9acedc53c338946585b',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const appId = 'archivo-comision';

// --- CONSTANTS ---
const SECTIONS = [
  { name: 'Actas', icon: Folder },
  { name: 'Convocatorias', icon: Bell },
  { name: 'Documentación', icon: Layers },
  { name: 'Plan Estratégico Cuatrienal', icon: Map },
  { name: 'Concreción Curso 2025-26', icon: CalendarDays },
];

const DOCUMENT_TYPES = ['Acta', 'Informe', 'Resolución', 'Anexo', 'Otro'];
const STATUS_TYPES = ['Borrador', 'En Revisión', 'Aprobado'];

const APP_VERSION = 'v1.5.1';

const COMMISSION_MEMBERS = [
  {
    id: 1,
    name: 'Amaya Galarza',
    role: 'Presidenta de la Comisión',
    location: 'Col. San Francisco de Asís (Valladolid)',
    email: 'centroseducativos@pazybien.org',
    isPresident: true,
  },
  {
    id: 7,
    name: 'Fray Juan Cormenzana',
    role: 'Representante de la Titularidad',
    location: 'Provincia Ntra. Sra. de Montserrat',
    email: 'juan@pazybien.org',
    isPresident: false,
  },
  {
    id: 2,
    name: 'Rafael García',
    role: 'Director',
    location: 'Col. San Francisco de Asís (Valladolid)',
    email: 'colegiosanfrancisco@pazybien.org',
    isPresident: false,
  },
  {
    id: 3,
    name: 'Antonio Bernal',
    role: 'Director',
    location: 'Colegio Melchor Cano (Tarancón)',
    email: 'antonio@melchorcano.es',
    isPresident: false,
  },
  {
    id: 4,
    name: 'David Sánchez',
    role: 'Jefe de Estudios',
    location: 'Colegio Melchor Cano (Tarancón)',
    email: 'david@melchorcano.es',
    isPresident: false,
  },
  {
    id: 5,
    name: 'Francisco Javier Félix',
    role: 'Director',
    location: 'Col. San Buenaventura (Madrid)',
    email: 'direccion@sanbuenaventura.org',
    isPresident: false,
  },
  {
    id: 6,
    name: 'José Manuel Santos Alejano',
    role: 'Director de Infantil y Primaria',
    location: 'Col. San Buenaventura (Madrid)',
    email: 'josemanuelsantos@sanbuenaventura.org',
    isPresident: false,
  },
];

const StatusBadge = ({ status }) => {
  const styles = {
    Aprobado:
      'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50',
    'En Revisión':
      'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50',
    Borrador:
      'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  };
  const icons = {
    Aprobado: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />,
    'En Revisión': <RefreshCw className="w-3.5 h-3.5 mr-1" />,
    Borrador: <FileText className="w-3.5 h-3.5 mr-1" />,
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
        styles[status] || styles['Borrador']
      }`}
    >
      {icons[status]} {status}
    </span>
  );
};

const parseEventDate = (dateString) => {
  if (!dateString) return { day: '--', month: '---' };
  const d = new Date(dateString);
  const months = [
    'ENE',
    'FEB',
    'MAR',
    'ABR',
    'MAY',
    'JUN',
    'JUL',
    'AGO',
    'SEP',
    'OCT',
    'NOV',
    'DIC',
  ];
  return {
    day: d.getDate().toString().padStart(2, '0'),
    month: months[d.getMonth()],
  };
};

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      );
    }
    return false;
  });

  const [currentView, setCurrentView] = useState('dashboard');
  const [viewMode, setViewMode] = useState('list');
  const [bulkSelection, setBulkSelection] = useState(new Set());

  const [firebaseUser, setFirebaseUser] = useState(null);
  const [authLevel, setAuthLevel] = useState('none');
  const isAdmin = authLevel === 'admin';
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [sortOrder, setSortOrder] = useState('dateDesc');

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docToDelete, setDocToDelete] = useState(null);
  const [docToEdit, setDocToEdit] = useState(null);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [eventToEdit, setEventToEdit] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error('Auth error:', error);
        setIsLoading(false);
        setToast({
          message: 'Error de conexión con Firebase. Revisar permisos.',
          type: 'error',
        });
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => setFirebaseUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    const docsRef = collection(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'comision_docs'
    );
    const unsubDocs = onSnapshot(docsRef, (snapshot) => {
      setDocuments(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setTimeout(() => setIsLoading(false), 600);
    });

    const auditRef = collection(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'audit_logs'
    );
    const unsubAudit = onSnapshot(auditRef, (snapshot) => {
      setAuditLogs(
        snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      );
    });

    const eventsRef = collection(
      db,
      'artifacts',
      appId,
      'public',
      'data',
      'comision_events'
    );
    const unsubEvents = onSnapshot(eventsRef, (snapshot) => {
      if (snapshot.empty && !window.hasSeededEvents) {
        window.hasSeededEvents = true;
        const defaultEvents = [
          {
            date: '2025-10-17',
            title: 'Reunión de la Comisión',
            location: 'Col. San Francisco (Valladolid)',
          },
          {
            date: '2025-10-25',
            title: 'Encuentro de Formación',
            location: 'Col. San Buenaventura (Madrid)',
          },
          {
            date: '2026-02-17',
            title: 'Reunión de la Comisión y encuentro',
            location: 'Col. San Buenaventura (Madrid)',
          },
          {
            date: '2026-04-14',
            title: 'Formación de equipos directivos',
            location: 'Col. San Buenaventura',
          },
          {
            date: '2026-05-29',
            title: 'Reunión de la Comisión',
            location: 'Col. Melchor Cano (Tarancón)',
          },
        ];
        defaultEvents.forEach((ev) => addDoc(eventsRef, ev));
      } else {
        const evs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        evs.sort((a, b) => new Date(a.date) - new Date(b.date));
        setEvents(evs);
      }
    });

    return () => {
      unsubDocs();
      unsubAudit();
      unsubEvents();
    };
  }, [firebaseUser]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  useEffect(() => {
    setBulkSelection(new Set());
  }, [currentView, debouncedSearch, typeFilter, sortOrder]);

  const filteredDocs = useMemo(() => {
    return documents
      .filter((doc) => {
        const searchLower = debouncedSearch.toLowerCase();
        const matchesSearch =
          doc.title?.toLowerCase().includes(searchLower) ||
          (doc.tags &&
            doc.tags.some((tag) => tag.toLowerCase().includes(searchLower)));
        const matchesType = typeFilter === 'Todos' || doc.type === typeFilter;
        const matchesSection =
          currentView === 'dashboard' || doc.section === currentView;
        return matchesSearch && matchesType && matchesSection;
      })
      .sort((a, b) => {
        if (sortOrder === 'dateDesc')
          return new Date(b.date) - new Date(a.date);
        if (sortOrder === 'dateAsc') return new Date(a.date) - new Date(b.date);
        if (sortOrder === 'titleAsc')
          return (a.title || '').localeCompare(b.title || '');
        return 0;
      });
  }, [documents, debouncedSearch, typeFilter, currentView, sortOrder]);

  const pinnedDocs = useMemo(
    () =>
      documents
        .filter((d) => d.isPinned)
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [documents]
  );
  const recentDocs = [...documents]
    .sort(
      (a, b) =>
        new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date)
    )
    .slice(0, 4);

  const stats = {
    total: documents.length || 1,
    actualTotal: documents.length,
    actas: documents.filter((d) => d.type === 'Acta').length,
    informes: documents.filter((d) => d.type === 'Informe').length,
  };

  const logAuditActivity = async (action, details) => {
    if (!firebaseUser) return;
    try {
      await addDoc(
        collection(db, 'artifacts', appId, 'public', 'data', 'audit_logs'),
        {
          action,
          details,
          user: 'Administrador',
          timestamp: new Date().toISOString(),
        }
      );
    } catch (e) {
      console.warn('Audit log error: ', e);
    }
  };

  const handleTogglePin = async (docObj, e) => {
    e.stopPropagation();
    if (!firebaseUser || !isAdmin) return;
    try {
      await updateDoc(
        doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'comision_docs',
          docObj.id
        ),
        { isPinned: !docObj.isPinned }
      );
      await logAuditActivity(
        docObj.isPinned ? 'UNPIN' : 'PIN',
        `${docObj.isPinned ? 'Desmarcó' : 'Marcó'} como destacado: ${
          docObj.title
        }`
      );
    } catch (error) {
      console.error(error);
    }
  };

  const toggleBulkSelection = (id, e) => {
    e.stopPropagation();
    const newSet = new Set(bulkSelection);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setBulkSelection(newSet);
  };

  const selectAllFiltered = () => {
    if (bulkSelection.size === filteredDocs.length && filteredDocs.length > 0)
      setBulkSelection(new Set());
    else setBulkSelection(new Set(filteredDocs.map((d) => d.id)));
  };

  const executeBulkDelete = async () => {
    if (!firebaseUser || bulkSelection.size === 0) return;
    try {
      for (let id of bulkSelection) {
        await deleteDoc(
          doc(db, 'artifacts', appId, 'public', 'data', 'comision_docs', id)
        );
      }
      await logAuditActivity(
        'BULK_DELETE',
        `Eliminó ${bulkSelection.size} documentos en lote.`
      );
      setBulkSelection(new Set());
      setIsBulkDeleteModalOpen(false);
      setToast({
        message: 'Documentos eliminados correctamente',
        type: 'success',
      });
      setTimeout(() => setToast(null), 3500);
    } catch (error) {
      setToast({ message: 'Error al eliminar documentos', type: 'error' });
    }
  };

  const exportSelectedToCSV = () => {
    if (bulkSelection.size === 0) return;
    const docsToExport = filteredDocs.filter((d) => bulkSelection.has(d.id));
    const headers = [
      'Título',
      'Sección',
      'Tipo',
      'Estado',
      'Fecha',
      'Autor',
      'Archivo',
    ];
    const rows = docsToExport.map((d) => [
      `"${(d.title || '').replace(/"/g, '""')}"`,
      `"${d.section}"`,
      `"${d.type}"`,
      `"${d.status}"`,
      `"${d.date}"`,
      `"${d.author || 'Secretaría'}"`,
      `"${d.fileName}"`,
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `exportacion_lote_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    logAuditActivity(
      'EXPORT',
      `Exportó listado de ${bulkSelection.size} documentos.`
    );
  };

  const exportToCSV = () => {
    if (filteredDocs.length === 0) return;
    const headers = [
      'Título',
      'Sección',
      'Tipo',
      'Estado',
      'Fecha',
      'Autor',
      'Archivo',
    ];
    const rows = filteredDocs.map((d) => [
      `"${(d.title || '').replace(/"/g, '""')}"`,
      `"${d.section}"`,
      `"${d.type}"`,
      `"${d.status}"`,
      `"${d.date}"`,
      `"${d.author || 'Secretaría'}"`,
      `"${d.fileName}"`,
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `archivo_comision_${currentView.replace(/\s+/g, '_').toLowerCase()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    logAuditActivity(
      'EXPORT',
      `Exportó listado CSV de la sección: ${currentView}`
    );
  };

  const handleAddEvent = async (eventData) => {
    if (!firebaseUser) return;
    try {
      await addDoc(
        collection(db, 'artifacts', appId, 'public', 'data', 'comision_events'),
        eventData
      );
      await logAuditActivity(
        'UPLOAD',
        `Añadió fecha al calendario: ${eventData.title}`
      );
      setIsEventModalOpen(false);
      setToast({ message: 'Evento añadido a la agenda', type: 'success' });
      setTimeout(() => setToast(null), 3500);
    } catch (error) {
      setToast({ message: 'Error al añadir el evento', type: 'error' });
    }
  };

  const executeDeleteEvent = async () => {
    if (!firebaseUser || !eventToDelete) return;
    try {
      await deleteDoc(
        doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'comision_events',
          eventToDelete.id
        )
      );
      await logAuditActivity(
        'DELETE',
        `Eliminó evento: ${eventToDelete.title}`
      );
      setEventToDelete(null);
      setToast({ message: 'Evento eliminado', type: 'success' });
      setTimeout(() => setToast(null), 3500);
    } catch (error) {
      setToast({ message: 'Error al eliminar el evento', type: 'error' });
    }
  };

  const handleEditEvent = async (updatedEventData) => {
    if (!firebaseUser || !eventToEdit) return;
    try {
      await updateDoc(
        doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'comision_events',
          eventToEdit.id
        ),
        updatedEventData
      );
      await logAuditActivity(
        'EDIT',
        `Modificó evento: ${updatedEventData.title}`
      );
      setEventToEdit(null);
      setToast({
        message: 'Evento actualizado correctamente',
        type: 'success',
      });
      setTimeout(() => setToast(null), 3500);
    } catch (error) {
      setToast({ message: 'Error al actualizar el evento', type: 'error' });
    }
  };

  const handleUpload = async (newDoc, fileObj) => {
    if (!firebaseUser) return;
    setIsUploading(true);
    setUploadProgress(10);
    try {
      let downloadURL = null;
      let finalSize = 'Desconocido';
      if (fileObj) {
        finalSize = (fileObj.size / (1024 * 1024)).toFixed(2) + ' MB';
        const fileRef = ref(
          storage,
          `comision_docs/${Date.now()}_${fileObj.name}`
        );
        const uploadTask = uploadBytesResumable(fileRef, fileObj);
        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) =>
              setUploadProgress(
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100 === 100
                  ? 99
                  : (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              ),
            (error) => reject(error),
            async () => {
              downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });
      }
      const docData = {
        ...newDoc,
        fileName: newDoc.fileName || 'documento_sin_archivo.pdf',
        size: finalSize,
        tags: newDoc.tags
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t),
        url: downloadURL,
        timestamp: new Date().toISOString(),
        isPinned: false,
      };
      await addDoc(
        collection(db, 'artifacts', appId, 'public', 'data', 'comision_docs'),
        docData
      );
      await logAuditActivity('UPLOAD', `Subió el documento: ${newDoc.title}`);
      setIsUploading(false);
      setUploadProgress(0);
      setIsUploadOpen(false);
      setToast({ message: 'Documento subido con éxito', type: 'success' });
      setTimeout(() => setToast(null), 3500);
    } catch (error) {
      setIsUploading(false);
      setUploadProgress(0);
      if (error.code && error.code.includes('storage/')) {
        setToast({
          message: 'Archivo no adjuntado por permisos. Metadatos guardados.',
          type: 'error',
        });
        await addDoc(
          collection(db, 'artifacts', appId, 'public', 'data', 'comision_docs'),
          {
            ...newDoc,
            size: '0.0 MB',
            tags: newDoc.tags
              .split(',')
              .map((t) => t.trim())
              .filter((t) => t),
            timestamp: new Date().toISOString(),
            isPinned: false,
          }
        );
        setIsUploadOpen(false);
      } else {
        setToast({
          message: 'Error crítico al subir el documento',
          type: 'error',
        });
      }
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleEdit = async (updatedDocData) => {
    if (!firebaseUser || !docToEdit) return;
    try {
      await updateDoc(
        doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'comision_docs',
          docToEdit.id
        ),
        {
          ...updatedDocData,
          tags: updatedDocData.tags
            .split(',')
            .map((t) => t.trim())
            .filter((t) => t),
        }
      );
      await logAuditActivity(
        'EDIT',
        `Modificó metadatos: ${updatedDocData.title}`
      );
      setDocToEdit(null);
      setToast({
        message: 'Documento actualizado correctamente',
        type: 'success',
      });
      setTimeout(() => setToast(null), 3500);
    } catch (error) {
      setToast({ message: 'Error al actualizar', type: 'error' });
    }
  };

  const executeDelete = async () => {
    if (!firebaseUser || !docToDelete) return;
    try {
      await deleteDoc(
        doc(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'comision_docs',
          docToDelete.id
        )
      );
      await logAuditActivity(
        'DELETE',
        `Eliminó el documento: ${docToDelete.title}`
      );
      setDocToDelete(null);
      setToast({ message: 'Documento eliminado', type: 'success' });
      setTimeout(() => setToast(null), 3500);
    } catch (error) {
      setToast({ message: 'Error al eliminar', type: 'error' });
    }
  };

  const handleGlobalLogin = (password) => {
    if (password === 'admin2026') {
      setAuthLevel('admin');
      return true;
    }
    if (password === 'comision2026') {
      setAuthLevel('reader');
      return true;
    }
    return false;
  };

  const handleLogin = (password) => {
    if (password === 'admin2026') {
      setAuthLevel('admin');
      setIsLoginOpen(false);
      setToast({ message: 'Modo Administrador activado', type: 'success' });
      setTimeout(() => setToast(null), 3500);
      return true;
    }
    return false;
  };

  if (authLevel === 'none') {
    return <GlobalLogin onLogin={handleGlobalLogin} isDarkMode={isDarkMode} />;
  }

  return (
    <div
      className={`min-h-screen flex flex-col font-sans relative transition-colors duration-300 bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-200 ${
        isDarkMode ? 'dark' : ''
      }`}
    >
      {/* HEADER NAVBAR */}
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center overflow-hidden bg-white rounded-lg">
                <img
                  src="https://i.ibb.co/mFSsggTb/logo.png"
                  alt="Logo"
                  className="w-full h-full object-contain p-1"
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-lg text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                  Comisión de Centros Educativos
                  <span className="px-1.5 py-0.5 text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded font-bold uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                    {APP_VERSION}
                  </span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide font-semibold mt-0.5">
                  Provincia de Montserrat
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-full transition-colors"
                title="Cambiar tema"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
              {isAdmin ? (
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-medium transition-all shadow-sm active:scale-95"
                >
                  <Upload className="w-4 h-4" />{' '}
                  <span className="hidden sm:inline">Subir Documento</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-5 py-2.5 rounded-full font-bold transition-all shadow-sm active:scale-95"
                >
                  <Lock className="w-4 h-4 text-slate-500 dark:text-slate-400" />{' '}
                  <span className="hidden sm:inline">Acceso Admin</span>
                </button>
              )}
              <button
                onClick={() => setAuthLevel('none')}
                className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto custom-scrollbar">
            <nav className="flex space-x-2 sm:space-x-8" aria-label="Tabs">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`whitespace-nowrap py-3.5 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                  currentView === 'dashboard'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" /> Resumen
              </button>
              {SECTIONS.map((section) => (
                <button
                  key={section.name}
                  onClick={() => setCurrentView(section.name)}
                  className={`whitespace-nowrap py-3.5 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                    currentView === section.name
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <section.icon className="w-4 h-4" /> {section.name}
                </button>
              ))}
              {isAdmin && (
                <button
                  onClick={() => setCurrentView('audit')}
                  className={`whitespace-nowrap py-3.5 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ml-auto ${
                    currentView === 'audit'
                      ? 'border-amber-500 text-amber-600 dark:text-amber-400 dark:border-amber-400'
                      : 'border-transparent text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-300'
                  }`}
                >
                  <Activity className="w-4 h-4" /> Auditoría
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* FLOATING BULK ACTIONS BAR */}
      {isAdmin && bulkSelection.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-10 fade-in border border-slate-700 dark:border-slate-200">
          <div className="flex items-center gap-2 font-bold">
            <CheckSquare className="w-5 h-5 text-blue-400 dark:text-blue-600" />
            <span>{bulkSelection.size} seleccionados</span>
          </div>
          <div className="w-px h-6 bg-slate-700 dark:bg-slate-300"></div>
          <div className="flex gap-2">
            <button
              onClick={exportSelectedToCSV}
              className="px-4 py-2 bg-slate-800 dark:bg-slate-100 hover:bg-slate-700 dark:hover:bg-slate-200 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" /> Exportar
            </button>
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="px-4 py-2 bg-red-500/10 text-red-400 dark:text-red-600 hover:bg-red-500 hover:text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Eliminar
            </button>
          </div>
          <button
            onClick={() => setBulkSelection(new Set())}
            className="ml-2 p-1 text-slate-400 hover:text-white dark:text-slate-500 dark:hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* --- DASHBOARD VIEW --- */}
            {currentView === 'dashboard' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* VISUAL ANALYTICS (STATS) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-center transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                          <Database className="w-5 h-5" />
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                          Fondo Documental
                        </p>
                      </div>
                      <p className="text-3xl font-black text-slate-800 dark:text-white">
                        {stats.actualTotal}
                      </p>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-4 overflow-hidden flex">
                      <div
                        className="bg-blue-500 h-2"
                        style={{ width: '100%' }}
                      ></div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-center transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                          Actas vs. Informes
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-800 dark:text-white">
                          {stats.actas}{' '}
                          <span className="text-slate-400 font-normal">
                            Actas
                          </span>
                        </p>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">
                          {stats.informes}{' '}
                          <span className="text-slate-400 font-normal">
                            Inf.
                          </span>
                        </p>
                      </div>
                    </div>
                    <div
                      className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-2 overflow-hidden flex"
                      title={`${stats.actas} Actas / ${stats.informes} Informes`}
                    >
                      <div
                        className="bg-emerald-500 h-2 transition-all duration-1000"
                        style={{
                          width: `${(stats.actas / stats.total) * 100}%`,
                        }}
                      ></div>
                      <div
                        className="bg-amber-400 h-2 transition-all duration-1000"
                        style={{
                          width: `${(stats.informes / stats.total) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* PINNED DOCS SECTION */}
                {pinnedDocs.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <Pin
                        className="w-5 h-5 text-amber-500"
                        fill="currentColor"
                      />{' '}
                      Documentos Clave
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {pinnedDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="bg-gradient-to-br from-amber-50/50 to-white dark:from-amber-900/10 dark:to-slate-900 p-4 rounded-xl border border-amber-200 dark:border-amber-800/50 shadow-sm hover:shadow-md transition-all group flex flex-col h-full relative cursor-pointer"
                          onClick={() => setSelectedDoc(doc)}
                        >
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                            {isAdmin && (
                              <button
                                onClick={(e) => handleTogglePin(doc, e)}
                                className="p-1.5 bg-white dark:bg-slate-800 shadow text-amber-500 rounded-full hover:bg-amber-50 dark:hover:bg-amber-900/50"
                              >
                                <Pin className="w-4 h-4" fill="currentColor" />
                              </button>
                            )}
                          </div>
                          <div className="flex items-start gap-3 mb-2">
                            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-500">
                              <FileText className="w-5 h-5" />
                            </div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-100 leading-tight line-clamp-2 text-sm">
                              {doc.title}
                            </h4>
                          </div>
                          <div className="mt-auto pt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="font-bold text-amber-600 dark:text-amber-500">
                              {doc.section}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {doc.date}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-500" /> Añadidos
                      Recientemente
                    </h3>
                    {recentDocs.length === 0 ? (
                      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                        <Folder className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                          El archivo documental está vacío.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recentDocs.map((doc) => (
                          <div
                            key={doc.id}
                            className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all group flex flex-col h-full relative"
                          >
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                              <button
                                onClick={() => setSelectedDoc(doc)}
                                className="p-2 bg-white dark:bg-slate-800 shadow text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {isAdmin && (
                                <button
                                  onClick={(e) => handleTogglePin(doc, e)}
                                  className="p-2 bg-white dark:bg-slate-800 shadow text-amber-500 rounded-full hover:bg-amber-50 dark:hover:bg-slate-700"
                                >
                                  <Pin className="w-4 h-4" />
                                </button>
                              )}
                              {isAdmin && (
                                <button
                                  onClick={() => setDocToEdit(doc)}
                                  className="p-2 bg-white dark:bg-slate-800 shadow text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            <div
                              className="flex justify-between items-start mb-3 cursor-pointer"
                              onClick={() => setSelectedDoc(doc)}
                            >
                              <div
                                className={`p-2.5 rounded-xl ${
                                  doc.type === 'Acta'
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                }`}
                              >
                                <FileText className="w-6 h-6" />
                              </div>
                              <StatusBadge status={doc.status} />
                            </div>
                            <h4
                              className="font-bold text-slate-800 dark:text-white leading-tight mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 cursor-pointer"
                              onClick={() => setSelectedDoc(doc)}
                            >
                              {doc.title}
                            </h4>
                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-4">
                              {doc.section}
                            </p>
                            <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" /> {doc.date}
                              </span>
                              <span className="font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                {doc.type}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* AGENDA SECTION */}
                  <div className="lg:col-span-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-blue-500" />{' '}
                        Agenda del Curso
                      </h3>
                      {isAdmin && (
                        <button
                          onClick={() => setIsEventModalOpen(true)}
                          className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-colors"
                          title="Añadir evento"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-2">
                      <div className="space-y-1">
                        {events.length === 0 ? (
                          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
                            No hay eventos programados.
                          </p>
                        ) : (
                          events.map((event) => {
                            const { day, month } = parseEventDate(event.date);
                            return (
                              <div
                                key={event.id}
                                className="flex gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group relative"
                              >
                                {isAdmin && (
                                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <button
                                      onClick={() => setEventToEdit(event)}
                                      className="p-1.5 bg-white dark:bg-slate-800 shadow-sm text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700"
                                      title="Editar evento"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setEventToDelete(event)}
                                      className="p-1.5 bg-white dark:bg-slate-800 shadow-sm text-red-500 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30"
                                      title="Eliminar evento"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                                <div className="flex flex-col items-center justify-center w-16 h-16 shrink-0 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 text-blue-700 dark:text-blue-400 rounded-xl shadow-sm">
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-0.5">
                                    {month}
                                  </span>
                                  <span className="text-2xl font-black leading-none">
                                    {day}
                                  </span>
                                </div>
                                <div className="flex flex-col justify-center pr-6">
                                  <p className="font-bold text-slate-800 dark:text-white text-sm leading-tight mb-1.5">
                                    {event.title}
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                                    <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />{' '}
                                    {event.location}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200/60 dark:border-slate-800 mt-8 space-y-4">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" /> Miembros de la
                    Comisión
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {COMMISSION_MEMBERS.map((member) => (
                      <div
                        key={member.id}
                        className={`p-4 rounded-2xl border flex items-start gap-4 transition-all hover:shadow-md ${
                          member.isPresident
                            ? 'bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-slate-900 border-amber-200 dark:border-amber-800/50'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-700'
                        }`}
                      >
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                            member.isPresident
                              ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-500'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {member.isPresident ? (
                            <Award className="w-6 h-6" />
                          ) : (
                            <User className="w-6 h-6" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="font-black text-slate-900 dark:text-white text-sm truncate"
                            title={member.name}
                          >
                            {member.name}
                          </p>
                          <p
                            className={`text-[11px] font-bold uppercase tracking-wider mt-0.5 ${
                              member.isPresident
                                ? 'text-amber-600 dark:text-amber-500'
                                : 'text-blue-600 dark:text-blue-400'
                            }`}
                          >
                            {member.role}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-start gap-1.5 font-medium leading-tight">
                            <School className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-500 mt-0.5" />{' '}
                            <span className="line-clamp-2">
                              {member.location}
                            </span>
                          </p>
                          <a
                            href={`https://mail.google.com/mail/?view=cm&fs=1&to=${member.email}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 mt-1.5 flex items-center gap-1.5 font-medium transition-colors w-fit"
                            title={`Enviar correo por Gmail a ${member.name}`}
                          >
                            <Mail className="w-3.5 h-3.5 shrink-0" />{' '}
                            <span className="truncate">{member.email}</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* --- AUDIT VIEW --- */}
            {currentView === 'audit' && isAdmin && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <Activity className="w-8 h-8 text-amber-500" /> Registro de
                    Auditoría
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Historial inmutable de acciones en el repositorio
                    documental.
                  </p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                        <th className="p-4">Fecha y Hora</th>
                        <th className="p-4">Acción</th>
                        <th className="p-4 w-1/2">Detalles</th>
                        <th className="p-4">Usuario</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {auditLogs.map((log) => (
                        <tr
                          key={log.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-sm"
                        >
                          <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-xs">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${
                                log.action === 'UPLOAD'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                  : log.action.includes('DELETE')
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              }`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="p-4 font-medium text-slate-700 dark:text-slate-200">
                            {log.details}
                          </td>
                          <td className="p-4 text-slate-500 dark:text-slate-400">
                            {log.user}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* --- STANDARD SECTIONS VIEW --- */}
            {currentView !== 'dashboard' && currentView !== 'audit' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                      {currentView}
                    </h2>
                  </div>
                  <div className="flex items-center gap-3 self-start">
                    {isAdmin && (
                      <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white transition-all"
                      >
                        <FileSpreadsheet className="w-4 h-4" />{' '}
                        <span className="hidden sm:inline">Exportar Excel</span>
                      </button>
                    )}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1 flex shadow-sm shrink-0">
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md ${
                          viewMode === 'list'
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                      >
                        <List className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md ${
                          viewMode === 'grid'
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                      >
                        <LayoutGrid className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="Busca por título o etiqueta..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100/50 dark:hover:bg-slate-800 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-900 transition-all text-sm font-medium dark:text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2 px-2 border-l border-slate-100 dark:border-slate-800 shrink-0">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="bg-transparent text-sm font-semibold text-slate-700 dark:text-slate-300 py-2 focus:outline-none cursor-pointer max-w-[120px]"
                    >
                      <option value="Todos">Todos los tipos</option>
                      {DOCUMENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 px-2 border-l border-slate-100 dark:border-slate-800 shrink-0">
                    <ArrowUpDown className="w-4 h-4 text-slate-400" />
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="bg-transparent text-sm font-semibold text-slate-700 dark:text-slate-300 py-2 focus:outline-none cursor-pointer max-w-[150px]"
                    >
                      <option value="dateDesc">Más recientes</option>
                      <option value="dateAsc">Más antiguos</option>
                      <option value="titleAsc">Alfabético (A-Z)</option>
                    </select>
                  </div>
                </div>

                {filteredDocs.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center">
                    <div className="bg-slate-50 dark:bg-slate-800 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5">
                      <Search className="w-10 h-10 text-slate-300 dark:text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                      No se encontraron resultados
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      No hay documentos que coincidan con los filtros.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* GRID VIEW */}
                    {viewMode === 'grid' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in">
                        {filteredDocs.map((doc) => (
                          <div
                            key={doc.id}
                            className={`bg-white dark:bg-slate-900 rounded-2xl border ${
                              bulkSelection.has(doc.id)
                                ? 'border-blue-500 ring-2 ring-blue-500/20'
                                : 'border-slate-200 dark:border-slate-800'
                            } shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col relative group`}
                          >
                            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <button
                                onClick={() => setSelectedDoc(doc)}
                                className="p-2 bg-white dark:bg-slate-800 backdrop-blur text-blue-600 dark:text-blue-400 rounded-full shadow hover:bg-blue-50 dark:hover:bg-slate-700"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {isAdmin && (
                                <button
                                  onClick={(e) => handleTogglePin(doc, e)}
                                  className={`p-2 bg-white dark:bg-slate-800 shadow rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 ${
                                    doc.isPinned
                                      ? 'text-amber-500'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  <Pin
                                    className="w-4 h-4"
                                    fill={
                                      doc.isPinned ? 'currentColor' : 'none'
                                    }
                                  />
                                </button>
                              )}
                              {isAdmin && (
                                <button
                                  onClick={() => setDocToEdit(doc)}
                                  className="p-2 bg-white dark:bg-slate-800 backdrop-blur text-slate-600 dark:text-slate-300 rounded-full shadow hover:bg-slate-50 dark:hover:bg-slate-700"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              )}
                              {isAdmin && (
                                <button
                                  onClick={() => setDocToDelete(doc)}
                                  className="p-2 bg-white dark:bg-slate-800 backdrop-blur text-red-500 dark:text-red-400 rounded-full shadow hover:bg-red-50 dark:hover:bg-slate-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            {isAdmin && (
                              <div
                                className="absolute top-4 left-4 z-10 cursor-pointer"
                                onClick={(e) => toggleBulkSelection(doc.id, e)}
                              >
                                {bulkSelection.has(doc.id) ? (
                                  <CheckSquare className="w-5 h-5 text-blue-600" />
                                ) : (
                                  <Square className="w-5 h-5 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                              </div>
                            )}
                            <div
                              className="p-6 pb-4 flex-1 cursor-pointer pt-12"
                              onClick={() => setSelectedDoc(doc)}
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                  <FileText className="w-7 h-7" />
                                </div>
                              </div>
                              <h4 className="font-bold text-slate-900 dark:text-white text-lg leading-tight mb-2 line-clamp-2">
                                {doc.title}
                              </h4>
                              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4 truncate">
                                {doc.fileName}
                              </p>
                              <div className="flex flex-wrap gap-1.5 mb-4">
                                {doc.tags &&
                                  doc.tags.slice(0, 3).map((tag, i) => (
                                    <span
                                      key={i}
                                      className="px-2 py-1 text-[10px] font-bold uppercase rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                              </div>
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-auto">
                              <StatusBadge status={doc.status} />
                              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" /> {doc.date}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* LIST VIEW */}
                    {viewMode === 'list' && (
                      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              {isAdmin && (
                                <th
                                  className="p-5 w-12 text-center cursor-pointer"
                                  onClick={selectAllFiltered}
                                >
                                  {bulkSelection.size === filteredDocs.length &&
                                  filteredDocs.length > 0 ? (
                                    <CheckSquare className="w-5 h-5 text-blue-600 mx-auto" />
                                  ) : (
                                    <Square className="w-5 h-5 text-slate-300 dark:text-slate-600 mx-auto hover:text-blue-500" />
                                  )}
                                </th>
                              )}
                              <th className="p-5">Documento</th>
                              <th className="p-5 hidden md:table-cell">
                                Estado
                              </th>
                              <th className="p-5">Fecha</th>
                              <th className="p-5 hidden lg:table-cell">
                                Etiquetas
                              </th>
                              <th className="p-5 text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredDocs.map((doc) => (
                              <tr
                                key={doc.id}
                                className={`hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors group ${
                                  bulkSelection.has(doc.id)
                                    ? 'bg-blue-50/30 dark:bg-blue-900/10'
                                    : ''
                                }`}
                              >
                                {isAdmin && (
                                  <td
                                    className="p-5 text-center cursor-pointer"
                                    onClick={(e) =>
                                      toggleBulkSelection(doc.id, e)
                                    }
                                  >
                                    {bulkSelection.has(doc.id) ? (
                                      <CheckSquare className="w-5 h-5 text-blue-600 mx-auto" />
                                    ) : (
                                      <Square className="w-5 h-5 text-slate-300 dark:text-slate-600 mx-auto opacity-0 group-hover:opacity-100" />
                                    )}
                                  </td>
                                )}
                                <td
                                  className="p-5 cursor-pointer"
                                  onClick={() => setSelectedDoc(doc)}
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                                      <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                      <p className="font-bold text-slate-800 dark:text-white line-clamp-1 flex items-center gap-2">
                                        {doc.isPinned && (
                                          <Pin
                                            className="w-3.5 h-3.5 text-amber-500"
                                            fill="currentColor"
                                          />
                                        )}{' '}
                                        {doc.title}
                                      </p>
                                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                                        {doc.fileName} • {doc.size}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-5 hidden md:table-cell">
                                  <StatusBadge status={doc.status} />
                                </td>
                                <td className="p-5 text-sm font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                  {doc.date}
                                </td>
                                <td className="p-5 hidden lg:table-cell">
                                  <div className="flex flex-wrap gap-1.5">
                                    {doc.tags &&
                                      doc.tags.slice(0, 2).map((tag, i) => (
                                        <span
                                          key={i}
                                          className="px-2 py-1 text-[10px] font-bold uppercase rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 shadow-sm"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                  </div>
                                </td>
                                <td className="p-5 text-right">
                                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {isAdmin && (
                                      <button
                                        onClick={(e) => handleTogglePin(doc, e)}
                                        className={`p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg shadow-sm ${
                                          doc.isPinned
                                            ? 'text-amber-500'
                                            : 'text-slate-400'
                                        }`}
                                        title="Destacar"
                                      >
                                        <Pin className="w-4 h-4" />
                                      </button>
                                    )}
                                    {isAdmin && (
                                      <button
                                        onClick={() => setDocToEdit(doc)}
                                        className="p-2 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg shadow-sm"
                                        title="Editar"
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => setSelectedDoc(doc)}
                                      className="p-2 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 border border-blue-100 dark:border-slate-700 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-900 rounded-lg shadow-sm"
                                      title="Abrir Visor"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* --- TOAST --- */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-800 dark:bg-white text-white dark:text-slate-900 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 z-[100]">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-emerald-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 dark:text-red-500" />
          )}
          <span className="text-sm font-bold">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-3 text-slate-400 dark:text-slate-500 hover:text-white dark:hover:text-slate-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* --- MODALS --- */}
      {isBulkDeleteModalOpen && (
        <DeleteConfirmModal
          item={{ title: `${bulkSelection.size} documentos` }}
          onClose={() => setIsBulkDeleteModalOpen(false)}
          onConfirm={executeBulkDelete}
          isEvent={false}
        />
      )}
      {isLoginOpen && (
        <LoginModal
          onClose={() => setIsLoginOpen(false)}
          onLogin={handleLogin}
        />
      )}
      {docToDelete && (
        <DeleteConfirmModal
          item={docToDelete}
          onClose={() => setDocToDelete(null)}
          onConfirm={executeDelete}
        />
      )}
      {eventToDelete && (
        <DeleteConfirmModal
          item={eventToDelete}
          onClose={() => setEventToDelete(null)}
          onConfirm={executeDeleteEvent}
          isEvent={true}
        />
      )}
      {isUploadOpen && (
        <UploadModal
          onClose={() => setIsUploadOpen(false)}
          onUpload={handleUpload}
          uploadProgress={uploadProgress}
          isUploading={isUploading}
        />
      )}
      {isEventModalOpen && (
        <AddEventModal
          onClose={() => setIsEventModalOpen(false)}
          onAdd={handleAddEvent}
        />
      )}
      {eventToEdit && (
        <EditEventModal
          event={eventToEdit}
          onClose={() => setEventToEdit(null)}
          onSave={handleEditEvent}
        />
      )}
      {docToEdit && (
        <EditModal
          doc={docToEdit}
          onClose={() => setDocToEdit(null)}
          onSave={handleEdit}
        />
      )}
      {selectedDoc && (
        <DocumentModal doc={selectedDoc} onClose={() => setSelectedDoc(null)} />
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-slate-200 dark:bg-slate-800 rounded-2xl h-32 w-full"
          ></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-slate-200 dark:bg-slate-800 rounded-xl h-36 w-full"
              ></div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-1 space-y-4">
          <div className="h-6 w-40 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="bg-slate-200 dark:bg-slate-800 rounded-2xl h-96 w-full"></div>
        </div>
      </div>
    </div>
  );
}

function GlobalLogin({ onLogin, isDarkMode }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!onLogin(password)) {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 font-sans transition-colors bg-slate-100 dark:bg-slate-950 ${
        isDarkMode ? 'dark' : ''
      }`}
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-500 border border-transparent dark:border-slate-800">
        <div className="p-8 text-center border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-5 overflow-hidden border border-slate-100 dark:border-slate-700">
            <img
              src="https://i.ibb.co/mFSsggTb/logo.png"
              alt="Logo"
              className="w-16 h-16 object-contain p-1"
            />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight flex items-center justify-center gap-2">
            Acceso Restringido
          </h2>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-wide">
            Comisión de Centros Educativos
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-8">
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Clave de acceso
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                autoFocus
                className={`w-full pl-12 pr-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 bg-slate-50 dark:bg-slate-950 dark:text-white font-medium ${
                  error
                    ? 'border-red-300 dark:border-red-800 focus:ring-red-500/50 bg-red-50/50 dark:bg-red-900/20'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500/50'
                }`}
                placeholder="Introduce la clave..."
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center"
          >
            Entrar al Sistema
          </button>
        </form>
      </div>
    </div>
  );
}

function LoginModal({ onClose, onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!onLogin(password)) {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onMouseDown={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 border border-transparent dark:border-slate-800"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
          <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Lock className="w-5 h-5" /> Acceso Admin
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form
          onSubmit={handleSubmit}
          className="p-8 bg-slate-50/50 dark:bg-slate-900/50"
        >
          <input
            type="password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            autoFocus
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 mb-4 bg-white dark:bg-slate-950 dark:text-white font-medium ${
              error
                ? 'border-red-300 dark:border-red-800'
                : 'border-slate-200 dark:border-slate-800'
            }`}
            placeholder="Clave de admin..."
          />
          <button
            type="submit"
            className="w-full py-3 bg-slate-800 dark:bg-white dark:text-slate-900 text-white rounded-xl font-bold shadow-md active:scale-95 flex items-center justify-center gap-2"
          >
            <ShieldAlert className="w-4 h-4" /> Validar
          </button>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ item, onClose, onConfirm, isEvent = false }) {
  return (
    <div
      className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onMouseDown={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden text-center p-8 animate-in zoom-in-95 border border-transparent dark:border-slate-800"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5">
          <Trash2 className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
          ¿Eliminar {isEvent ? 'evento' : 'documento/s'}?
        </h3>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          Estás a punto de borrar{' '}
          <span className="font-bold text-slate-700 dark:text-slate-300">
            "{item.title}"
          </span>
          .
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            className="px-6 py-3 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md shadow-red-500/30"
          >
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

function AddEventModal({ onClose, onAdd }) {
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onMouseDown={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 border border-transparent dark:border-slate-800"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-500" /> Añadir Evento
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5 bg-slate-50/50 dark:bg-slate-900/50"
        >
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Título del Evento <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none bg-white dark:bg-slate-950 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Lugar / Medio <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none bg-white dark:bg-slate-950 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Fecha <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none bg-white dark:bg-slate-950 dark:text-white"
            />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditEventModal({ event, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: event.title,
    date: event.date,
    location: event.location,
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onMouseDown={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 border border-transparent dark:border-slate-800"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-amber-500" /> Editar Evento
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5 bg-slate-50/50 dark:bg-slate-900/50"
        >
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Título del Evento <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none bg-white dark:bg-slate-950 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Lugar / Medio <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none bg-white dark:bg-slate-950 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Fecha <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none bg-white dark:bg-slate-950 dark:text-white"
            />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditModal({ doc, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: doc.title,
    section: doc.section,
    type: doc.type,
    status: doc.status,
    date: doc.date,
    tags: (doc.tags || []).join(', '),
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onMouseDown={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 border border-transparent dark:border-slate-800"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-amber-500" /> Editar Metadatos
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5 bg-slate-50/50 dark:bg-slate-900/50"
        >
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 bg-white dark:bg-slate-950 dark:text-white outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Sección <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.section}
                onChange={(e) =>
                  setFormData({ ...formData, section: e.target.value })
                }
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 dark:text-white focus:ring-2"
              >
                {SECTIONS.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 dark:text-white focus:ring-2"
              >
                {STATUS_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Tipo
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 dark:text-white focus:ring-2"
              >
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Fecha
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 dark:text-white focus:ring-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Etiquetas (coma)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 bg-white dark:bg-slate-950 dark:text-white outline-none"
            />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UploadModal({ onClose, onUpload, uploadProgress, isUploading }) {
  const [formData, setFormData] = useState({
    title: '',
    section: 'Actas',
    type: 'Acta',
    status: 'Aprobado',
    date: new Date().toISOString().split('T')[0],
    author: 'Secretaría',
    tags: '',
    fileName: '',
    fileObj: null,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState('');

  const handleFileSelect = (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setFileError('El archivo supera el límite de 10MB.');
      setFormData((prev) => ({ ...prev, fileObj: null, fileName: '' }));
      return;
    }
    setFileError('');
    setFormData((prev) => ({ ...prev, fileObj: file, fileName: file.name }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title) onUpload(formData, formData.fileObj);
  };
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files[0]);
  }, []);

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onMouseDown={!isUploading ? onClose : undefined}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 border border-transparent dark:border-slate-800"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" /> Subir Documento
          </h3>
          {!isUploading && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {isUploading ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
              Subiendo documento...
            </h3>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 mb-2 overflow-hidden">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              {Math.round(uploadProgress)}% Completado
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-5 bg-slate-50/50 dark:bg-slate-900/50"
          >
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 bg-white dark:bg-slate-950 dark:text-white outline-none"
                placeholder="Ej. Acta Sesión..."
              />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Sección <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.section}
                  onChange={(e) =>
                    setFormData({ ...formData, section: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 dark:text-white focus:ring-2"
                >
                  {SECTIONS.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Estado
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 dark:text-white focus:ring-2"
                >
                  {STATUS_TYPES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tipo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 dark:text-white focus:ring-2"
                >
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Fecha
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-950 dark:text-white focus:ring-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Archivo (Max. 10MB) <span className="text-red-500">*</span>
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all bg-white dark:bg-slate-950 ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : fileError
                    ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              >
                <input
                  type="file"
                  required
                  id="file-upload"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload
                    className={`w-8 h-8 mb-2 ${
                      isDragging
                        ? 'text-blue-500'
                        : fileError
                        ? 'text-red-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  <span
                    className={`text-sm font-black ${
                      fileError
                        ? 'text-red-500'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {fileError ||
                      (isDragging
                        ? 'Suelta el archivo aquí'
                        : 'Haz clic o arrastra un archivo real')}
                  </span>
                </label>
                {formData.fileName && (
                  <div className="mt-3 inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 py-1.5 px-3 rounded-lg text-sm font-bold border border-emerald-200 dark:border-emerald-800/50">
                    <FileText className="w-4 h-4" /> {formData.fileName}
                  </div>
                )}
              </div>
            </div>
            <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md"
              >
                Subir a la nube
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function DocumentModal({ doc, onClose }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div
      className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      onMouseDown={onClose}
    >
      <div
        className={`bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 border border-transparent dark:border-slate-800 ${
          isFullscreen
            ? 'w-full h-full rounded-none'
            : 'w-full max-w-7xl h-[85vh] rounded-3xl'
        }`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white leading-tight truncate max-w-[200px] sm:max-w-xl">
                {doc.title}
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {doc.fileName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {doc.url && (
              <a
                href={doc.url}
                download
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-bold transition-colors mr-2"
              >
                <Download className="w-4 h-4" /> Descargar
              </a>
            )}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg hidden sm:block"
            >
              <Maximize className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          <div className="flex-1 bg-slate-200/50 dark:bg-slate-950 relative flex flex-col">
            {doc.url ? (
              <iframe
                src={`${doc.url}#view=FitH`}
                className="w-full h-full border-0"
                title={doc.title}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              ></iframe>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-2xl shadow-sm flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-800">
                  <Lock className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                </div>
                <h4 className="text-xl font-bold text-slate-700 dark:text-white mb-2">
                  Archivo no adjuntado
                </h4>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                  Este registro solo contiene los metadatos documentales. No hay
                  un archivo real vinculado para mostrar.
                </p>
              </div>
            )}
          </div>
          <div className="w-full md:w-[320px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 overflow-y-auto">
            <div className="p-6 space-y-8">
              <div>
                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                  Clasificación
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Estado
                    </span>
                    <StatusBadge status={doc.status} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Sección
                    </span>
                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 uppercase">
                      {doc.section}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Tipo
                    </span>
                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                      {doc.type}
                    </span>
                  </div>
                </div>
              </div>
              <hr className="border-slate-100 dark:border-slate-800" />
              <div>
                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                  Trazabilidad
                </h4>
                <div className="space-y-4">
                  <div>
                    <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1">
                      Fecha de documento
                    </span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-400" /> {doc.date}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1">
                      Autor / Órgano
                    </span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-slate-400" />{' '}
                      {doc.author || 'Secretaría General'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1">
                      Tamaño
                    </span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-slate-400" /> {doc.size}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
