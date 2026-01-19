import React from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const categoryColors = {
  academic: "bg-blue-100 text-blue-700 border-blue-200",
  cultural: "bg-purple-100 text-purple-700 border-purple-200",
  sports: "bg-green-100 text-green-700 border-green-200",
  workshop: "bg-orange-100 text-orange-700 border-orange-200",
  seminar: "bg-cyan-100 text-cyan-700 border-cyan-200",
  fest: "bg-pink-100 text-pink-700 border-pink-200",
  other: "bg-gray-100 text-gray-700 border-gray-200"
};

const statusColors = {
  upcoming: "bg-emerald-500",
  ongoing: "bg-blue-500",
  completed: "bg-gray-400",
  cancelled: "bg-red-500"
};

export default function EventCard({ event, onViewDetails, onRegister, isRegistered, registrationCount }) {
  const eventDate = new Date(event.date);
  const isPastDeadline = event.registration_deadline && new Date(event.registration_deadline) < new Date();
  const isFull = event.max_capacity && registrationCount >= event.max_capacity;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden h-full flex flex-col bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="relative h-48 overflow-hidden">
          <img
            src={event.image_url || `https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop`}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className={`${categoryColors[event.category]} border`}>
              {event.category}
            </Badge>
          </div>
          <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${statusColors[event.status]} ring-2 ring-white`} />
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-white font-bold text-lg line-clamp-2 drop-shadow-lg">{event.title}</h3>
          </div>
        </div>

        <CardContent className="flex-1 p-5 space-y-4">
          <p className="text-gray-600 text-sm line-clamp-2">{event.description || "Join us for an exciting event!"}</p>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>{format(eventDate, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            {event.start_time && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>{event.start_time}{event.end_time ? ` - ${event.end_time}` : ''}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-indigo-500" />
              <span>{event.venue}</span>
            </div>
            {event.max_capacity && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4 text-indigo-500" />
                <span>{registrationCount || 0} / {event.max_capacity} registered</span>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-5 pt-0 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onViewDetails(event)}
          >
            View Details
          </Button>
          {event.status === 'upcoming' && (
            <Button
              className={`flex-1 ${isRegistered ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              onClick={() => onRegister(event)}
              disabled={isRegistered || isPastDeadline || isFull}
            >
              {isRegistered ? 'Registered ✓' : isFull ? 'Full' : isPastDeadline ? 'Closed' : 'Register'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}