import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, TrendingUp, Activity, Plus, Edit, Trash2, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

import EventForm from 'EventForm';
import StatsCard from 'StatsCard';

export default function AdminPanel() {
  const [user, setUser] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        if (currentUser.role !== 'admin') {
          toast.error('Access denied. Admin privileges required.');
          window.location.href = '/';
        }
      } catch (error) {
        await base44.auth.redirectToLogin(window.location.pathname);
      }
    };
    checkAuth();
  }, []);

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.list('-created_date', 100),
    initialData: [],
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ['allRegistrations'],
    queryFn: () => base44.entities.Registration.list(null, 1000),
    initialData: [],
  });

  const createEventMutation = useMutation({
    mutationFn: (eventData) => base44.entities.Event.create(eventData),
    onSuccess: () => {
      queryClient.invalidateQueries(['events']);
      toast.success('Event created successfully!');
      setFormOpen(false);
      setEditingEvent(null);
    },
    onError: () => {
      toast.error('Failed to create event');
    }
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Event.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['events']);
      toast.success('Event updated successfully!');
      setFormOpen(false);
      setEditingEvent(null);
    },
    onError: () => {
      toast.error('Failed to update event');
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id) => base44.entities.Event.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['events']);
      toast.success('Event deleted successfully!');
    },
    onError: () => {
      toast.error('Failed to delete event');
    }
  });

  const handleSaveEvent = (eventData) => {
    if (editingEvent) {
      updateEventMutation.mutate({ id: editingEvent.id, data: eventData });
    } else {
      createEventMutation.mutate(eventData);
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormOpen(true);
  };

  const handleDelete = (event) => {
    if (window.confirm(`Are you sure you want to delete "${event.title}"?`)) {
      deleteEventMutation.mutate(event.id);
    }
  };

  const getRegistrationCount = (eventId) => {
    return registrations.filter(r => r.event_id === eventId && r.status !== 'cancelled').length;
  };

  const upcomingEvents = events.filter(e => e.status === 'upcoming').length;
  const totalRegistrations = registrations.filter(r => r.status === 'confirmed').length;

  const categoryColors = {
    academic: "bg-blue-100 text-blue-700",
    cultural: "bg-purple-100 text-purple-700",
    sports: "bg-green-100 text-green-700",
    workshop: "bg-orange-100 text-orange-700",
    seminar: "bg-cyan-100 text-cyan-700",
    fest: "bg-pink-100 text-pink-700",
    other: "bg-gray-100 text-gray-700"
  };

  const statusColors = {
    upcoming: "bg-emerald-100 text-emerald-700",
    ongoing: "bg-blue-100 text-blue-700",
    completed: "bg-gray-100 text-gray-700",
    cancelled: "bg-red-100 text-red-700"
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Access Restricted</h2>
          <p className="text-gray-500">Verifying admin privileges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="w-8 h-8 text-indigo-600" />
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Manage college events and registrations</p>
            </div>
            <Button
              onClick={() => {
                setEditingEvent(null);
                setFormOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Events"
            value={events.length}
            icon={Calendar}
            color="text-indigo-600"
            bgColor="bg-indigo-100"
            delay={0}
          />
          <StatsCard
            title="Upcoming Events"
            value={upcomingEvents}
            icon={TrendingUp}
            color="text-emerald-600"
            bgColor="bg-emerald-100"
            delay={0.1}
          />
          <StatsCard
            title="Total Registrations"
            value={totalRegistrations}
            icon={Users}
            color="text-purple-600"
            bgColor="bg-purple-100"
            delay={0.2}
          />
          <StatsCard
            title="Active Users"
            value={new Set(registrations.map(r => r.user_email)).size}
            icon={Activity}
            color="text-orange-600"
            bgColor="bg-orange-100"
            delay={0.3}
          />
        </div>

        {/* Events Table */}
        <Card className="shadow-xl border-0">
          <CardHeader className="border-b bg-white">
            <CardTitle className="text-xl font-bold">Event Management</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Event Title</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Venue</TableHead>
                    <TableHead className="font-semibold">Category</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Registrations</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eventsLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={7}>
                          <div className="h-12 bg-gray-100 animate-pulse rounded" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : events.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                        No events found. Create your first event to get started!
                      </TableCell>
                    </TableRow>
                  ) : (
                    events.map((event) => (
                      <TableRow key={event.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{event.title}</TableCell>
                        <TableCell>{format(new Date(event.date), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{event.venue}</TableCell>
                        <TableCell>
                          <Badge className={categoryColors[event.category]}>
                            {event.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[event.status]}>
                            {event.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span>{getRegistrationCount(event.id)}</span>
                            {event.max_capacity && (
                              <span className="text-gray-400">/ {event.max_capacity}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(event)}
                              className="hover:bg-indigo-50 hover:text-indigo-600"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(event)}
                              className="hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Event Form Modal */}
        <EventForm
          event={editingEvent}
          isOpen={formOpen}
          onClose={() => {
            setFormOpen(false);
            setEditingEvent(null);
          }}
          onSave={handleSaveEvent}
          isLoading={createEventMutation.isPending || updateEventMutation.isPending}
        />
      </div>
    </div>
  );
}