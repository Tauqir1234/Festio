import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, Mail, Building, Tag } from 'lucide-react';
import { format } from 'date-fns';

const categoryColors = {
  academic: "bg-blue-100 text-blue-700",
  cultural: "bg-purple-100 text-purple-700",
  sports: "bg-green-100 text-green-700",
  workshop: "bg-orange-100 text-orange-700",
  seminar: "bg-cyan-100 text-cyan-700",
  fest: "bg-pink-100 text-pink-700",
  other: "bg-gray-100 text-gray-700"
};

export default function EventDetailsModal({ event, isOpen, onClose, onRegister, isRegistered, registrationCount }) {
  if (!event) return null;

  const eventDate = new Date(event.date);
  const isPastDeadline = event.registration_deadline && new Date(event.registration_deadline) < new Date();
  const isFull = event.max_capacity && registrationCount >= event.max_capacity;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="relative h-56 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-lg">
            <img
              src={event.image_url || `https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop`}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-6 right-6">
              <Badge className={`${categoryColors[event.category]} mb-2`}>
                {event.category}
              </Badge>
              <DialogTitle className="text-2xl font-bold text-white">{event.title}</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-gray-700 leading-relaxed">
            {event.description || "Join us for this exciting event! More details coming soon."}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Calendar className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="font-medium">{format(eventDate, 'EEEE, MMMM d, yyyy')}</p>
              </div>
            </div>

            {event.start_time && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Clock className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Time</p>
                  <p className="font-medium">{event.start_time}{event.end_time ? ` - ${event.end_time}` : ''}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <MapPin className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Venue</p>
                <p className="font-medium">{event.venue}</p>
              </div>
            </div>

            {event.max_capacity && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Capacity</p>
                  <p className="font-medium">{registrationCount || 0} / {event.max_capacity} registered</p>
                </div>
              </div>
            )}

            {event.organizer && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Building className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Organizer</p>
                  <p className="font-medium">{event.organizer}</p>
                </div>
              </div>
            )}

            {event.contact_email && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Mail className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Contact</p>
                  <p className="font-medium">{event.contact_email}</p>
                </div>
              </div>
            )}

            {event.registration_deadline && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Tag className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Registration Deadline</p>
                  <p className="font-medium">{format(new Date(event.registration_deadline), 'MMMM d, yyyy')}</p>
                </div>
              </div>
            )}
          </div>

          {event.status === 'upcoming' && (
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>Close</Button>
              <Button
                className={`${isRegistered ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                onClick={() => onRegister(event)}
                disabled={isRegistered || isPastDeadline || isFull}
              >
                {isRegistered ? 'Already Registered ✓' : isFull ? 'Event Full' : isPastDeadline ? 'Registration Closed' : 'Register Now'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}