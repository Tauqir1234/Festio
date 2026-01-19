import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, Mail, User, GraduationCap, X } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function MyRegistrations() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        await base44.auth.redirectToLogin(window.location.pathname);
      }
    };
    fetchUser();
  }, []);

  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ['myRegistrations', user?.email],
    queryFn: () => base44.entities.Registration.filter({ user_email: user?.email }),
    enabled: !!user,
    initialData: [],
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.list(null, 100),
    initialData: [],
  });

  const cancelMutation = useMutation({
    mutationFn: (registrationId) => 
      base44.entities.Registration.update(registrationId, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['myRegistrations']);
      queryClient.invalidateQueries(['allRegistrations']);
      toast.success('Registration cancelled successfully');
    },
    onError: () => {
      toast.error('Failed to cancel registration');
    }
  });

  const getEventDetails = (eventId) => {
    return events.find(e => e.id === eventId);
  };

  const handleCancel = (registration) => {
    if (window.confirm('Are you sure you want to cancel this registration?')) {
      cancelMutation.mutate(registration.id);
    }
  };

  const activeRegistrations = registrations.filter(r => r.status !== 'cancelled');

  const statusColors = {
    confirmed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    attended: "bg-blue-100 text-blue-700"
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <GraduationCap className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Loading...</h2>
          <p className="text-gray-500">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-purple-600" />
            My Registrations
          </h1>
          <p className="text-gray-600 mt-1">View and manage your event registrations</p>
        </motion.div>

        {/* User Info Card */}
        <Card className="mb-8 shadow-lg border-0 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-indigo-100">Name</p>
                  <p className="font-semibold">{user.full_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-indigo-100">Email</p>
                  <p className="font-semibold">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-lg backdrop-blur">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-indigo-100">Total Registrations</p>
                  <p className="font-semibold">{activeRegistrations.length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Registrations List */}
        {isLoading ? (
          <div className="grid gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-white rounded-xl animate-pulse shadow-lg" />
            ))}
          </div>
        ) : registrations.length === 0 ? (
          <Card className="shadow-lg border-0">
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Registrations Yet</h3>
              <p className="text-gray-500 mb-6">You haven't registered for any events</p>
              <Button
                onClick={() => window.location.href = '/'}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Browse Events
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {registrations.map((registration) => {
              const event = getEventDetails(registration.event_id);
              if (!event) return null;

              return (
                <motion.div
                  key={registration.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="overflow-hidden shadow-lg border-0 hover:shadow-xl transition-shadow">
                    <div className="md:flex">
                      <div className="md:w-1/3 h-48 md:h-auto overflow-hidden">
                        <img
                          src={event.image_url || `https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop`}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="md:w-2/3">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={statusColors[registration.status]}>
                                  {registration.status}
                                </Badge>
                                <Badge variant="outline">{event.category}</Badge>
                              </div>
                              <CardTitle className="text-xl">{event.title}</CardTitle>
                            </div>
                            {registration.status === 'confirmed' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCancel(registration)}
                                className="hover:bg-red-50 hover:text-red-600"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Calendar className="w-4 h-4 text-indigo-500" />
                              <span className="text-sm">{format(new Date(event.date), 'EEEE, MMMM d, yyyy')}</span>
                            </div>
                            {event.start_time && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <Clock className="w-4 h-4 text-indigo-500" />
                                <span className="text-sm">{event.start_time}{event.end_time ? ` - ${event.end_time}` : ''}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="w-4 h-4 text-indigo-500" />
                              <span className="text-sm">{event.venue}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Calendar className="w-4 h-4 text-indigo-500" />
                              <span className="text-sm">Registered: {format(new Date(registration.registration_date), 'MMM d, yyyy')}</span>
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}