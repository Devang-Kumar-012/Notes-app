const noteForm = document.getElementById('noteForm');
const noteDate = document.getElementById('noteDate');
const noteText = document.getElementById('noteText');
const notesList = document.getElementById('notesList');
const filterDate = document.getElementById('filterDate');
const applyFilter = document.getElementById('applyFilter');
const clearFilter = document.getElementById('clearFilter');
const searchInput = document.getElementById('searchInput');
const toggleTheme = document.getElementById('toggleTheme');
const toggleSort = document.getElementById('toggleSort');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');
const clearAll = document.getElementById('clearAll');
const resetFormBtn = document.getElementById('resetForm');
const status = document.getElementById('status');
const storageKey = 'dailyNotesApp.notes';
const themeKey = 'dailyNotesApp.theme';

let sortNewest = true;

// Theme management
function initTheme() {
  const savedTheme = localStorage.getItem(themeKey) || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeButton(savedTheme);
}

function updateThemeButton(theme) {
  if (toggleTheme) {
    toggleTheme.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

function toggleThemeMode() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem(themeKey, newTheme);
  updateThemeButton(newTheme);
  announce(`Switched to ${newTheme} mode`);
}

if (toggleTheme) {
  toggleTheme.addEventListener('click', toggleThemeMode);
}

function loadNotes() {
  const stored = localStorage.getItem(storageKey);
  return stored ? JSON.parse(stored) : [];
}

function saveNotes(notes) {
  localStorage.setItem(storageKey, JSON.stringify(notes));
}

function formatDate(value) {
  if (!value) return 'No date';
  const date = new Date(value);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function announce(msg) {
  if (!status) return;
  status.textContent = msg;
  setTimeout(() => {
    if (status.textContent === msg) status.textContent = '';
  }, 2200);
}

function deleteNote(id) {
  const proceed = window.confirm('Are you sure you want to delete this note?');
  if (!proceed) return;

  const notes = loadNotes().filter(note => note.id !== id);
  saveNotes(notes);
  renderNotes();
  announce('Note deleted');
}

function renderNotes() {
  let notes = loadNotes();
  const selectedDate = filterDate.value;
  const query = (searchInput && searchInput.value || '').trim().toLowerCase();

  if (selectedDate) {
    notes = notes.filter(note => note.date === selectedDate);
  }

  if (query) {
    notes = notes.filter(n => n.text.toLowerCase().includes(query) || formatDate(n.date).toLowerCase().includes(query));
  }

  notes = notes.slice();
  notes.sort((a,b)=> sortNewest ? (b.id > a.id ? 1 : -1) : (a.id > b.id ? 1 : -1));

  notesList.innerHTML = '';

  if (!notes.length) {
    const emptyCard = document.createElement('div');
    emptyCard.className = 'note-empty';
    emptyCard.textContent = selectedDate
      ? 'No notes found for that date. Try another date or clear the filter.'
      : (query ? 'No notes match that search.' : 'No notes yet. Add a note using the form above.');
    notesList.appendChild(emptyCard);
    return;
  }

  notes.forEach(note => {
    const noteItem = document.createElement('article');
    noteItem.className = 'note-item';
    noteItem.classList.add(`note-color-${note.colorIndex ?? 0}`);

    const noteHeader = document.createElement('div');
    noteHeader.className = 'note-item-meta';

    const title = document.createElement('strong');
    title.textContent = formatDate(note.date);

    const actions = document.createElement('div');
    actions.className = 'note-item-actions';

    const editButton = document.createElement('button');
    editButton.className = 'note-edit';
    editButton.type = 'button';
    editButton.innerHTML = '✏️ Edit';
    editButton.addEventListener('click', ()=>{
      noteDate.value = note.date;
      noteText.value = note.text;
      // move to top when saving
      deleteNote(note.id);
      noteDate.focus();
      announce('Editing note — save to update');
    });

    const deleteButton = document.createElement('button');
    deleteButton.className = 'note-delete';
    deleteButton.type = 'button';
    deleteButton.innerHTML = '🗑️ Delete';
    deleteButton.addEventListener('click', () => deleteNote(note.id));

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    noteHeader.appendChild(title);
    noteHeader.appendChild(actions);

    const body = document.createElement('p');
    body.textContent = note.text;

    noteItem.appendChild(noteHeader);
    noteItem.appendChild(body);
    notesList.appendChild(noteItem);
  });
}

noteForm.addEventListener('submit', event => {
  event.preventDefault();
  const dateValue = noteDate.value;
  const textValue = noteText.value.trim();

  if (!dateValue || !textValue) {
    return;
  }

  const notes = loadNotes();
  notes.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    date: dateValue,
    text: textValue,
    colorIndex: Math.floor(Math.random() * 5)
  });
  saveNotes(notes);
  renderNotes();

  noteForm.reset();
  noteDate.value = new Date().toISOString().slice(0, 10);
  noteDate.focus();
  announce('Note saved');
});

applyFilter.addEventListener('click', () => {
  renderNotes();
});

clearFilter.addEventListener('click', () => {
  filterDate.value = '';
  renderNotes();
});

// Search
if (searchInput) searchInput.addEventListener('input', () => renderNotes());

// Toggle sort order
if (toggleSort) toggleSort.addEventListener('click', () => {
  sortNewest = !sortNewest;
  toggleSort.textContent = sortNewest ? 'Newest' : 'Oldest';
  renderNotes();
});

// Export
if (exportBtn) exportBtn.addEventListener('click', () => {
  const notes = loadNotes();
  const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `notes-export-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  announce('Export ready');
});

// Import
if (importBtn && importFile) {
  importBtn.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result);
        if (!Array.isArray(imported)) throw new Error('Invalid file');
        const merged = [...imported, ...loadNotes()];
        saveNotes(merged);
        renderNotes();
        announce('Import successful');
      } catch (err) {
        alert('Failed to import notes: ' + err.message);
      }
    };
    reader.readAsText(f);
    importFile.value = '';
  });
}

// Clear all
if (clearAll) clearAll.addEventListener('click', () => {
  if (!confirm('Clear all notes permanently?')) return;
  saveNotes([]);
  renderNotes();
  announce('All notes cleared');
});

// Reset form
if (resetFormBtn) resetFormBtn.addEventListener('click', () => {
  noteForm.reset();
  noteDate.value = new Date().toISOString().slice(0, 10);
});

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  const today = new Date().toISOString().slice(0, 10);
  noteDate.value = today;
  renderNotes();
});
