import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

import EventCard from '../components/events/EventCard';
import EventFilters from '../components/events/EventFilters';
import EventDetailsModal from '../components/events/EventDetailsModal';

export default function Events() {
  const [filters, setFilters] = useState({ search: '', category: 'all', status: 'upcoming' });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [user, setUser] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log('User not authenticated');
      }
    };
    fetchUser();
  }, []);

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.list('-date', 100),
    initialData: [],
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ['registrations', user?.email],
    queryFn: () => base44.entities.Registration.filter({ user_email: user?.email }),
    enabled: !!user,
    initialData: [],
  });

  const { data: allRegistrations = [] } = useQuery({
    queryKey: ['allRegistrations'],
    queryFn: () => base44.entities.Registration.list(null, 1000),
    initialData: [],
  });

  const registerMutation = useMutation({
    mutationFn: async (event) => {
      if (!user) {
        await base44.auth.redirectToLogin(window.location.pathname);
        return;
      }

      const existingReg = registrations.find(r => r.event_id === event.id);
      if (existingReg) {
        toast.info('You are already registered for this event');
        return;
      }

      return base44.entities.Registration.create({
        event_id: event.id,
        event_title: event.title,
        user_email: user.email,
        user_name: user.full_name,
        registration_date: new Date().toISOString(),
        status: 'confirmed'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['registrations']);
      queryClient.invalidateQueries(['allRegistrations']);
      toast.success('Successfully registered for the event!');
      setDetailsOpen(false);
    },
    onError: () => {
      toast.error('Failed to register. Please try again.');
    }
  });

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
                         event.description?.toLowerCase().includes(filters.search.toLowerCase());
    const matchesCategory = filters.category === 'all' || event.category === filters.category;
    const matchesStatus = filters.status === 'all' || event.status === filters.status;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getRegistrationCount = (eventId) => {
    return allRegistrations.filter(r => r.event_id === eventId && r.status !== 'cancelled').length;
  };

  const isRegistered = (eventId) => {
    return registrations.some(r => r.event_id === eventId && r.status !== 'cancelled');
  };

  const handleViewDetails = (event) => {
    setSelectedEvent(event);
    setDetailsOpen(true);
  };

  const handleRegister = (event) => {
    registerMutation.mutate(event);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-indigo-600" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              College Events
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Discover and register for exciting campus events
          </p>
        </motion.div>

        {/* Filters */}
        <EventFilters filters={filters} setFilters={setFilters} />

        {/* Events Grid */}
        {eventsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-96 bg-white rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No events found</h3>
            <p className="text-gray-500">Try adjusting your filters or check back later</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onViewDetails={handleViewDetails}
                onRegister={handleRegister}
                isRegistered={isRegistered(event.id)}
                registrationCount={getRegistrationCount(event.id)}
              />
            ))}
          </div>
        )}

        {/* Event Details Modal */}
        <EventDetailsModal
          event={selectedEvent}
          isOpen={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          onRegister={handleRegister}
          isRegistered={selectedEvent ? isRegistered(selectedEvent.id) : false}
          registrationCount={selectedEvent ? getRegistrationCount(selectedEvent.id) : 0}
        />
      </div>
    </div>
  );
}