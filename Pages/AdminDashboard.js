import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from 'date-fns';
import {
  Calendar, Users, Plus, Edit, Trash2, Eye,
  BarChart3, ClipboardList, Settings, CheckCircle
} from 'lucide-react';
import EventForm from '../components/events/EventForm';
import StatsCard from '../components/dashboard/StatsCard';

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

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedEventForRegistrations, setSelectedEventForRegistrations] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u.role !== 'admin') {
        toast.error('Access denied. Admin only.');
      }
      setUser(u);
    }).catch(() => toast.error('Please login as admin'));
  }, []);

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['admin-events'],
    queryFn: () => base44.entities.Event.list('-created_date'),
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ['admin-registrations'],
    queryFn: () => base44.entities.Registration.list('-registration_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Event.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      toast.success('Event created successfully');
      setFormOpen(false);
    },
    onError: () => toast.error('Failed to create event')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Event.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      toast.success('Event updated successfully');
      setFormOpen(false);
      setEditingEvent(null);
    },
    onError: () => toast.error('Failed to update event')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Event.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      toast.success('Event deleted successfully');
    },
    onError: () => toast.error('Failed to delete event')
  });

  const markAttendedMutation = useMutation({
    mutationFn: (id) => base44.entities.Registration.update(id, { status: 'attended' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-registrations'] });
      toast.success('Marked as attended');
    }
  });

  const handleSave = (data) => {
    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getRegistrationCount = (eventId) => {
    return registrations.filter(r => r.event_id === eventId && r.status === 'confirmed').length;
  };

  const eventRegistrations = selectedEventForRegistrations
    ? registrations.filter(r => r.event_id === selectedEventForRegistrations.id)
    : [];

  const upcomingCount = events.filter(e => e.status === 'upcoming').length;
  const totalRegistrations = registrations.filter(r => r.status === 'confirmed').length;
  const completedCount = events.filter(e => e.status === 'completed').length;

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Admin Access Required</h2>
          <p className="text-gray-500">Please login with an admin account to access this page.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold mb-1">Admin Dashboard</h1>
              <p className="text-slate-300">Manage events and registrations</p>
            </div>
            <Button
              onClick={() => { setEditingEvent(null); setFormOpen(true); }}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Event
            </Button>
          </motion.div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 -mt-16 mb-8 relative z-10">
          <StatsCard
            title="Total Events"
            value={events.length}
            icon={Calendar}
            color="text-indigo-600"
            bgColor="bg-indigo-100"
          />
          <StatsCard
            title="Upcoming"
            value={upcomingCount}
            icon={BarChart3}
            color="text-emerald-600"
            bgColor="bg-emerald-100"
            delay={0.1}
          />
          <StatsCard
            title="Total Registrations"
            value={totalRegistrations}
            icon={Users}
            color="text-blue-600"
            bgColor="bg-blue-100"
            delay={0.2}
          />
          <StatsCard
            title="Completed"
            value={completedCount}
            icon={CheckCircle}
            color="text-purple-600"
            bgColor="bg-purple-100"
            delay={0.3}
          />
        </div>

        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="bg-white shadow-lg p-1 rounded-xl">
            <TabsTrigger value="events" className="rounded-lg">
              <Calendar className="w-4 h-4 mr-2" />
              Events
            </TabsTrigger>
            <TabsTrigger value="registrations" className="rounded-lg">
              <ClipboardList className="w-4 h-4 mr-2" />
              Registrations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events">
            <Card className="bg-white border-0 shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Event</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Registrations</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {events.map(event => (
                      <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{event.title}</p>
                            <p className="text-sm text-gray-500">{event.venue}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {format(new Date(event.date), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={categoryColors[event.category]}>
                            {event.category}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={statusColors[event.status]}>
                            {event.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {getRegistrationCount(event.id)}
                          {event.max_capacity && ` / ${event.max_capacity}`}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedEventForRegistrations(event)}
                            >
                              <Eye className="w-4 h-4 text-gray-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setEditingEvent(event); setFormOpen(true); }}
                            >
                              <Edit className="w-4 h-4 text-blue-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this event?')) {
                                  deleteMutation.mutate(event.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="registrations">
            <Card className="bg-white border-0 shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Event</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Registered On</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {registrations.slice(0, 50).map(reg => (
                      <tr key={reg.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{reg.user_name || 'N/A'}</p>
                            <p className="text-sm text-gray-500">{reg.user_email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {reg.event_title}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {format(new Date(reg.registration_date), 'MMM d, yyyy h:mm a')}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={
                            reg.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            reg.status === 'attended' ? 'bg-blue-100 text-blue-700' :
                            'bg-red-100 text-red-700'
                          }>
                            {reg.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {reg.status === 'confirmed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markAttendedMutation.mutate(reg.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Mark Attended
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Event Registrations Modal */}
        {selectedEventForRegistrations && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="bg-white max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedEventForRegistrations.title}</h3>
                    <p className="text-sm text-gray-500">Registered Participants</p>
                  </div>
                  <Button variant="ghost" onClick={() => setSelectedEventForRegistrations(null)}>
                    ✕
                  </Button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-96">
                {eventRegistrations.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No registrations yet</p>
                ) : (
                  <div className="space-y-3">
                    {eventRegistrations.map(reg => (
                      <div key={reg.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{reg.user_name || 'N/A'}</p>
                          <p className="text-sm text-gray-500">{reg.user_email}</p>
                        </div>
                        <Badge className={
                          reg.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          reg.status === 'attended' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }>
                          {reg.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* Event Form Modal */}
      <EventForm
        event={editingEvent}
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditingEvent(null); }}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}