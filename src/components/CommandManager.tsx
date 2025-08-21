// src/components/CommandManager.tsx
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Command } from '@/lib/types';
import { Plus, Pencil, Trash2, Zap, Tag, Loader2 } from 'lucide-react';
import { Toast } from '@/components/ui/Toast';
import { DataTable } from '@/components/ui/DataTable'; // --- Mengimpor DataTable baru
import { Pagination } from '@/components/ui/Pagination';
import { StatusFilter } from '@/components/ui/StatusFilter';
import { ColumnDef } from '@tanstack/react-table'; // --- Mengimpor ColumnDef

export function CommandManager() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCommand, setEditingCommand] = useState<Command | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    trigger: '',
    response: '',
    description: '',
    isActive: true,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const statusOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'active', label: 'Aktif' },
    { value: 'inactive', label: 'Tidak Aktif' },
  ];

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const primaryColor = '#664ae7';
  const BASE_URL = 'http://localhost:8000/api';

  useEffect(() => {
    fetchCommands();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage, statusFilter]);

  const fetchCommands = async () => {
    try {
      const response = await fetch(`${BASE_URL}/whatsapp/commands`);
      if (!response.ok) {
        throw new Error('Failed to fetch commands');
      }
      const data = await response.json();
      setCommands(data.commands || []);
    } catch (error) {
      console.error('Error fetching commands:', error);
      setToast({ message: 'Gagal memuat daftar perintah.', type: 'error' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isEditing = !!editingCommand;
      const url = `${BASE_URL}/whatsapp/commands${isEditing ? `/${editingCommand.trigger}` : ''}`;
      const method = isEditing ? 'PUT' : 'POST';

      const payload = {
        trigger: formData.trigger,
        response: formData.response,
        description: formData.description,
        is_active: formData.isActive,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchCommands();
        handleCloseModal();
        setToast({ message: 'Perintah berhasil disimpan!', type: 'success' });
      } else {
        const errorData = await response.json();
        console.error('Failed to save command:', errorData);
        setToast({ message: errorData.message || 'Gagal menyimpan perintah.', type: 'error' });
      }
    } catch (error) {
      console.error('Error saving command:', error);
      setToast({ message: 'Terjadi kesalahan jaringan.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (trigger: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus perintah ini?')) return;

    try {
      const response = await fetch(`${BASE_URL}/whatsapp/commands`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger }),
      });

      if (response.ok) {
        await fetchCommands();
        setToast({ message: 'Perintah berhasil dihapus!', type: 'success' });
      } else {
        const errorData = await response.json();
        console.error('Failed to delete command:', errorData);
        setToast({ message: errorData.message || 'Gagal menghapus perintah.', type: 'error' });
      }
    } catch (error) {
      console.error('Error deleting command:', error);
      setToast({ message: 'Terjadi kesalahan jaringan.', type: 'error' });
    }
  };

  const handleEdit = (command: Command) => {
    setEditingCommand(command);
    setFormData({
      trigger: command.trigger ?? '', // Pastikan selalu string
      response: command.response ?? '', // Pastikan selalu string
      description: command.description ?? '', // Pastikan selalu string
      isActive: command.is_active ?? true,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCommand(null);
    setFormData({
      trigger: '',
      response: '',
      description: '',
      isActive: true,
    });
  };

  const filteredCommands = useMemo(() => {
    let filteredBySearch = commands.filter(cmd => {
      const safeDescription = cmd.description || '';
      const safeResponse = cmd.response || '';
      return (
        cmd.trigger.toLowerCase().includes(searchTerm.toLowerCase()) ||
        safeDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        safeResponse.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filteredBySearch = filteredBySearch.filter(cmd => cmd.is_active === isActive);
    }
    
    return filteredBySearch;
  }, [commands, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredCommands.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCommands = filteredCommands.slice(startIndex, startIndex + itemsPerPage);

  // --- Definisi kolom menggunakan ColumnDef dari TanStack Table ---
  const commandColumns: ColumnDef<Command>[] = useMemo(() => [
    {
      accessorKey: 'trigger',
      header: 'Perintah (Trigger)',
      cell: ({ row }) => (
        <code className="bg-gray-100 px-2 py-1 rounded-md text-sm font-mono font-semibold text-purple-700">
          {row.original.trigger}
        </code>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Deskripsi',
      cell: ({ row }) => (
        <span className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap block">
          {row.original.description}
        </span>
      ),
    },
    {
      accessorKey: 'response',
      header: 'Respon',
      cell: ({ row }) => (
        <span className="max-w-sm overflow-hidden text-ellipsis whitespace-nowrap block">
          {row.original.response}
        </span>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            row.original.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {row.original.is_active ? 'Aktif' : 'Tidak Aktif'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Aksi',
      cell: ({ row }) => {
        const command = row.original;
        return (
        <div className="flex justify-start gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEdit(command)}
            className="text-gray-600 hover:bg-gray-100 inline-flex items-center justify-center"
          >
            <Pencil size={16} />
            <span className="ml-2 hidden md:inline">Edit</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(command.trigger)}
            className="text-red-500 hover:bg-red-50 inline-flex items-center justify-center"
          >
            <Trash2 size={16} />
            <span className="ml-2 hidden md:inline">Hapus</span>
          </Button>
        </div>
        );
      },
    },
  ], [handleEdit, handleDelete]);
  // --- Akhir definisi kolom ---

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between border-b p-6 gap-4">
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            <Zap className="text-purple-600" />
            Manajemen Perintah Bot
          </CardTitle>
          <div className="flex flex-col sm:flex-row items-center w-full md:w-auto gap-2">
            <Input
              type="text"
              placeholder="Cari perintah..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-auto"
            />
            <div className="w-full sm:w-auto">
              <StatusFilter
                placeholder="Pilih Status"
                options={statusOptions}
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as 'all' | 'active' | 'inactive')}
              />
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              style={{ backgroundColor: primaryColor }}
              className="w-full sm:w-auto hover:opacity-85 transition-opacity flex items-center justify-center gap-1 py-2"
            >
              <Plus size={16} />
              <span>Tambah Baru</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-hidden">
            <DataTable // Menggunakan DataTable dari shadcn/ui
              columns={commandColumns}
              data={currentCommands}
              noDataMessage="Tidak ada perintah yang ditemukan."
            />
          </div>
          {filteredCommands.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              setItemsPerPage={setItemsPerPage}
              totalItems={filteredCommands.length}
            />
          )}
        </CardContent>

        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingCommand ? 'Edit Perintah' : 'Tambah Perintah Baru'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Perintah (Trigger)"
              value={formData.trigger}
              onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
              placeholder="Contoh: !help, !info"
              required
              disabled={!!editingCommand}
              className="rounded-lg border border-gray-300 focus:border-[#664ae7] focus:ring-0"
            />
            <Input
              label="Deskripsi"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Deskripsi singkat tentang perintah ini"
              required
              className="rounded-lg border border-gray-300 focus:border-[#664ae7] focus:ring-0"
            />
            <Textarea
              label="Respon"
              value={formData.response}
              onChange={(e) => setFormData({ ...formData, response: e.target.value })}
              placeholder="Respon bot saat perintah dipicu"
              rows={5}
              required
              className="rounded-lg border border-gray-300 focus:border-[#664ae7] focus:ring-0"
            />
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={!!formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded-sm border-gray-300 h-4 w-4"
                style={{ color: primaryColor, accentColor: primaryColor }}
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700 select-none">
                Aktifkan Perintah
              </label>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseModal}
                className="hover:bg-gray-200"
              >
                Batal
              </Button>
              <Button
                type="submit"
                // @ts-ignore
                loading={loading}
                style={{ backgroundColor: primaryColor }}
                className="hover:opacity-85 transition-opacity"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                    {editingCommand ? 'Menyimpan...' : 'Menambah...'}
                  </>
                ) : (
                  <span>
                    {editingCommand ? 'Simpan Perubahan' : 'Tambah Perintah'}
                  </span>
                )}
              </Button>
            </div>
          </form>
        </Modal>
      </Card>
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}