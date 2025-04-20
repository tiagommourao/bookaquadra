
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { EventsTable } from "./components/EventsTable";
import { EventsFilters } from "./components/EventsFilters";
import { EventModal } from "./components/EventModal";
import { EventStatCards } from "./components/EventStatCards";
import { useEvents, useEventsStatistics, EventFilters, PaginationParams } from "@/hooks/admin/useEventsData";
import { Plus } from "lucide-react";
import { Court } from "@/types";
import { useCourts } from "@/hooks/useCourts";

const EventsList = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [filters, setFilters] = useState<EventFilters>({});
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    limit: 10,
  });

  const { data: eventsData, isLoading: isLoadingEvents } = useEvents(filters, pagination);
  const { data: stats, isLoading: isLoadingStats } = useEventsStatistics();
  const { data: courts, isLoading: isLoadingCourts } = useCourts();

  const handleOpenModal = (eventId?: string) => {
    setSelectedEventId(eventId || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEventId(null);
  };

  const handleFilterChange = (newFilters: EventFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page when filters change
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Eventos & Torneios</h1>
          <Button onClick={() => handleOpenModal()} className="flex items-center gap-1">
            <Plus className="h-4 w-4" />
            Novo Evento
          </Button>
        </div>

        <EventStatCards stats={stats} isLoading={isLoadingStats} />

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Gerenciamento de Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <EventsFilters 
              courts={courts as Court[] || []} 
              onFilterChange={handleFilterChange} 
              isLoading={isLoadingCourts} 
            />

            <EventsTable 
              events={eventsData?.data || []} 
              isLoading={isLoadingEvents} 
              onEdit={handleOpenModal}
              pagination={{
                currentPage: pagination.page,
                totalPages: eventsData?.count ? Math.ceil(eventsData.count / pagination.limit) : 1,
                onPageChange: handlePageChange
              }}
            />
          </CardContent>
        </Card>
      </div>

      <EventModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        eventId={selectedEventId} 
        courts={courts as Court[] || []}
      />
    </AdminLayout>
  );
};

export default EventsList;
