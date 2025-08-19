// src/components/CommandManager.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Command } from '@/lib/types';

export function CommandManager() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCommand, setEditingCommand] = useState<Command | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    trigger: '',
    response: '',
    description: '',
    isActive: true
  });

  useEffect(() => {
    fetchCommands();
  }, []);

  const fetchCommands = async () => {
    try {
      const response = await fetch('/api/whatsapp/commands');
      const data = await response.json();
      setCommands(data.commands || []);
    } catch (error) {
      console.error('Error fetching commands:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const method = editingCommand ? 'PUT' : 'POST';
      const payload = editingCommand
        ? { ...formData, trigger: editingCommand.trigger }
        : formData;

      const response = await fetch('/api/whatsapp/commands', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await fetchCommands();
        handleCloseModal();
      } else {
        console.error('Failed to save command');
      }
    } catch (error) {
      console.error('Error saving command:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (trigger: string) => {
    if (!confirm('Are you sure you want to delete this command?')) return;

    try {
      const response = await fetch('/api/whatsapp/commands', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger })
      });

      if (response.ok) {
        await fetchCommands();
      }
    } catch (error) {
      console.error('Error deleting command:', error);
    }
  };

  const handleEdit = (command: Command) => {
    setEditingCommand(command);
    setFormData({
      trigger: command.trigger,
      response: command.response,
      description: command.description,
      isActive: command.isActive
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
      isActive: true
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Bot Commands</CardTitle>
        <Button onClick={() => setIsModalOpen(true)}>
          Add Command
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {commands.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No commands found</p>
          ) : (
            commands.map((command) => (
              <div
                key={command.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                      {command.trigger}
                    </code>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        command.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {command.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEdit(command)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(command.trigger)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">{command.description}</p>
                <p className="text-sm bg-gray-50 p-2 rounded">
                  <strong>Response:</strong> {command.response}
                </p>
              </div>
            ))
          )}
        </div>
      </CardContent>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCommand ? 'Edit Command' : 'Add New Command'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Trigger"
            value={formData.trigger}
            onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
            placeholder="e.g., !help"
            required
            disabled={!!editingCommand}
          />
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of the command"
            required
          />
          <Textarea
            label="Response"
            value={formData.response}
            onChange={(e) => setFormData({ ...formData, response: e.target.value })}
            placeholder="Bot response when command is triggered"
            rows={4}
            required
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-gray-300 text-whatsapp-primary focus:ring-whatsapp-primary"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Active
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {editingCommand ? 'Update' : 'Add'} Command
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}