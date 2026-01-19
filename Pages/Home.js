import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Calendar, Users, Star, TrendingUp, Plus } from 'lucide-react';
import EventCard from 'EventCard';
import EventFilters from 'EventFilters';
import EventDetailsModal from 'EventDetailsModal';
import StatsCard from 'StatsCard';

export default function Home() {
  const [user, setUser] = useState(null);
  const [filters, setFilters] = useState({ search: '', category: 'all', status: 'all' });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.list('-date'),
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ['registrations', user?.email],
    queryFn: () => base44.entities.Registration.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: allRegistrations = [] } = useQuery({
    queryKey: ['all-registrations'],
    queryFn: () => base44.entities.Registration.list(),
  });

  const registerMutation = useMutation({
    mutationFn: (event) => base44.entities.Registration.create({
      event_id: event.id,
      event_title: event.title,
      user_email: user.email,
      user_name: user.full_name,
      registration_date: new Date().toISOString(),
      status: 'confirmed'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      queryClient.invalidateQueries({ queryKey: ['all-registrations'] });
      toast.success('Successfully registered for the event!');
      setDetailsModalOpen(false);
    },
    onError: () => toast.error('Registration failed. Please try again.')
  });

  const filteredEvents = events.filter(event => {
    const matchesSearch = !filters.search || 
      event.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
      event.description?.toLowerCase().includes(filters.search.toLowerCase());
    const matchesCategory = filters.category === 'all' || event.category === filters.category;
    const matchesStatus = filters.status === 'all' || event.status === filters.status;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getRegistrationCount = (eventId) => {
    return allRegistrations.filter(r => r.event_id === eventId && r.status === 'confirmed').length;
  };

  const isRegistered = (eventId) => {
    return registrations.some(r => r.event_id === eventId && r.status === 'confirmed');
  };

  const handleRegister = (event) => {
    if (!user) {
      toast.error('Please login to register for events');
      return;
    }
    registerMutation.mutate(event);
  };

  const upcomingCount = events.filter(e => e.status === 'upcoming').length;
  const totalRegistrations = allRegistrations.filter(r => r.status === 'confirmed').length;
  const myRegistrations = registrations.filter(r => r.status === 'confirmed').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-6">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696daede63e21f525f61b904/ad7002bf1_Gemini_Generated_Image_7wz81n7wz81n7wz8.png" 
                alt="Festio Logo" 
                className="w-32 h-32 md:w-40 md:h-40 object-contain"
              />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Festio
            </h1>
            <p className="text-xl md:text-2xl text-indigo-100 max-w-2xl mx-auto mb-8">
              Events Evolved - Discover, explore and participate in exciting campus events
            </p>
            {user && (
              <p className="text-lg text-indigo-200">
                Welcome back, <span className="font-semibold text-white">{user.full_name}</span>!
              </p>
            )}
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-50 to-transparent" />
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Section */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 -mt-20 mb-12 relative z-20">
          <StatsCard
            title="Upcoming Events"
            value={upcomingCount}
            icon={Calendar}
            color="text-indigo-600"
            bgColor="bg-indigo-100"
            delay={0}
          />
          <StatsCard
            title="Total Registrations"
            value={totalRegistrations}
            icon={Users}
            color="text-emerald-600"
            bgColor="bg-emerald-100"
            delay={0.1}
          />
          <StatsCard
            title="My Registrations"
            value={user ? myRegistrations : '-'}
            icon={Star}
            color="text-amber-600"
            bgColor="bg-amber-100"
            delay={0.2}
          />
          <StatsCard
            title="Active Categories"
            value={new Set(events.map(e => e.category)).size}
            icon={TrendingUp}
            color="text-purple-600"
            bgColor="bg-purple-100"
            delay={0.3}
          />
        </section>

        {/* Filters */}
        <EventFilters filters={filters} setFilters={setFilters} />

        {/* Events Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {filters.status === 'all' ? 'All Events' : `${filters.status.charAt(0).toUpperCase() + filters.status.slice(1)} Events`}
            </h2>
            <span className="text-gray-500">{filteredEvents.length} events found</span>
          </div>

          {eventsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-white rounded-2xl h-96 animate-pulse shadow-lg" />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No events found</h3>
              <p className="text-gray-500">Try adjusting your filters or check back later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onViewDetails={(e) => {
                      setSelectedEvent(e);
                      setDetailsModalOpen(true);
                    }}
                    onRegister={handleRegister}
                    isRegistered={isRegistered(event.id)}
                    registrationCount={getRegistrationCount(event.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </main>

      {/* Event Details Modal */}
      <EventDetailsModal
        event={selectedEvent}
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        onRegister={handleRegister}
        isRegistered={selectedEvent ? isRegistered(selectedEvent.id) : false}
        registrationCount={selectedEvent ? getRegistrationCount(selectedEvent.id) : 0}
      />
    </div>
  );
}