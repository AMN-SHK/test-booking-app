import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Home, Users, Loader2 } from 'lucide-react';
import { createRoom, type CreateRoomDTO } from '../../api/rooms';
import { useToast } from '../../hooks/useToast';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateRoomModal = ({ isOpen, onClose }: CreateRoomModalProps) => {
  if (!isOpen) return null;
  
  return <CreateRoomForm onClose={onClose} />;
};

// Separate form component that resets when modal opens
const CreateRoomForm = ({ onClose }: { onClose: () => void }) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [errors, setErrors] = useState<{ name?: string; capacity?: string }>({});

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'Room name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Room name must be at least 2 characters';
    }

    const cap = parseInt(capacity);
    if (!capacity) {
      newErrors.capacity = 'Capacity is required';
    } else if (isNaN(cap) || cap < 1) {
      newErrors.capacity = 'Capacity must be at least 1';
    } else if (cap > 100) {
      newErrors.capacity = 'Capacity cannot exceed 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create room mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateRoomDTO) => createRoom(data),
    onSuccess: () => {
      toast.success('Room created successfully!');
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['adminBookings'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      onClose();
    },
    onError: () => {
      toast.error('Failed to create room. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    createMutation.mutate({
      name: name.trim(),
      capacity: parseInt(capacity),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
      
      <div 
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-6 pb-4">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Home className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 text-center">Create New Room</h2>
          <p className="text-gray-500 text-center mt-2">
            Add a new meeting room to the system
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6">
          {/* Room Name */}
          <div className="mb-4">
            <label htmlFor="room-name" className="block text-sm font-medium text-gray-700 mb-2">
              Room Name
            </label>
            <div className="relative">
              <input
                type="text"
                id="room-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder="e.g., Conference Room A"
                className={`w-full px-4 py-3 border rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Capacity */}
          <div className="mb-6">
            <label htmlFor="room-capacity" className="block text-sm font-medium text-gray-700 mb-2">
              Capacity
            </label>
            <div className="relative">
              <input
                type="number"
                id="room-capacity"
                value={capacity}
                onChange={(e) => {
                  setCapacity(e.target.value);
                  setErrors((prev) => ({ ...prev, capacity: undefined }));
                }}
                placeholder="e.g., 10"
                min="1"
                max="100"
                className={`w-full px-4 py-3 pr-12 border rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                  errors.capacity ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <Users className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            {errors.capacity && <p className="mt-1 text-sm text-red-500">{errors.capacity}</p>}
            <p className="mt-1 text-xs text-gray-500">Maximum 100 people</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-semibold py-3 px-4 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Room'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
