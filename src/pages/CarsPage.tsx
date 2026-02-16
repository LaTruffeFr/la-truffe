import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Car } from '../lib/supabase';
import { CarForm } from '../components/CarForm';
import { CarCard } from '../components/CarCard';
import './CarsPage.css';

export function CarsPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCars = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCars(data || []);
    } catch (error) {
      console.error('Error fetching cars:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);

  return (
    <div className="cars-page">
      <header className="page-header">
        <h1>Marketplace Voitures</h1>
        <p>Achetez et vendez des voitures facilement</p>
      </header>

      <div className="container">
        <CarForm onCarAdded={fetchCars} />

        <section className="cars-section">
          <h2>Voitures disponibles</h2>

          {loading ? (
            <div className="loading">Chargement...</div>
          ) : cars.length === 0 ? (
            <div className="empty-state">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H8.5a1 1 0 0 0-.8.4L5 11l-5.16.86a1 1 0 0 0-.84.99V16h3" />
                <circle cx="6.5" cy="16.5" r="2.5" />
                <circle cx="16.5" cy="16.5" r="2.5" />
              </svg>
              <p>Aucune voiture disponible pour le moment</p>
              <p className="empty-hint">Soyez le premier à poster une voiture!</p>
            </div>
          ) : (
            <div className="cars-grid">
              {cars.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
