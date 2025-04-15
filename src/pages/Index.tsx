
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">BookaQuadra</h1>
          <nav>
            <ul className="flex space-x-4">
              <li><Link to="/login" className="hover:underline">Login</Link></li>
              <li><Link to="/admin" className="hover:underline">Admin</Link></li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <section className="text-center max-w-4xl mx-auto py-16">
          <h2 className="text-4xl font-bold mb-6">Reserva de Quadras Simplificada</h2>
          <p className="text-xl mb-8">
            Reserve quadras de tênis, beach tennis, padel e mais com apenas alguns cliques.
            Gerencie suas reservas de forma fácil e eficiente.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/login">
              <Button size="lg">Faça Login</Button>
            </Link>
            <Link to="/admin">
              <Button variant="outline" size="lg">Área Administrativa</Button>
            </Link>
          </div>
        </section>

        <section className="py-12 grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-accent rounded-lg">
            <h3 className="text-xl font-bold mb-3">Fácil de Usar</h3>
            <p>Interface intuitiva para encontrar e reservar quadras rapidamente.</p>
          </div>
          <div className="text-center p-6 bg-accent rounded-lg">
            <h3 className="text-xl font-bold mb-3">Pagamentos Online</h3>
            <p>Processos de pagamento seguros para suas reservas.</p>
          </div>
          <div className="text-center p-6 bg-accent rounded-lg">
            <h3 className="text-xl font-bold mb-3">Lembretes & Notificações</h3>
            <p>Receba lembretes sobre suas próximas reservas.</p>
          </div>
        </section>
      </main>

      <footer className="bg-gray-100 py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} BookaQuadra. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
