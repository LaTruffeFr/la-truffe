import { useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import './CarForm.css';

type CarFormProps = {
  onCarAdded: () => void;
};

export function CarForm({ onCarAdded }: CarFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    price: '',
    mileage: '',
    fuel_type: 'essence',
    transmission: 'manuelle',
    description: '',
    image_url: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('cars').insert([
        {
          user_id: crypto.randomUUID(),
          brand: formData.brand,
          model: formData.model,
          year: formData.year,
          price: parseFloat(formData.price),
          mileage: parseInt(formData.mileage),
          fuel_type: formData.fuel_type,
          transmission: formData.transmission,
          description: formData.description,
          image_url: formData.image_url || null,
        },
      ]);

      if (error) throw error;

      setFormData({
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        price: '',
        mileage: '',
        fuel_type: 'essence',
        transmission: 'manuelle',
        description: '',
        image_url: '',
      });

      onCarAdded();
    } catch (error) {
      console.error('Error adding car:', error);
      alert('Erreur lors de l\'ajout de la voiture');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="car-form">
      <h2>Poster une voiture</h2>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="brand">Marque *</label>
          <input
            type="text"
            id="brand"
            required
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            placeholder="Ex: Toyota, BMW, Renault"
          />
        </div>

        <div className="form-group">
          <label htmlFor="model">Modèle *</label>
          <input
            type="text"
            id="model"
            required
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            placeholder="Ex: Camry, X5, Clio"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="year">Année *</label>
          <input
            type="number"
            id="year"
            required
            min="1900"
            max={new Date().getFullYear() + 1}
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
          />
        </div>

        <div className="form-group">
          <label htmlFor="price">Prix (€) *</label>
          <input
            type="number"
            id="price"
            required
            min="0"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="Ex: 15000"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="mileage">Kilométrage *</label>
          <input
            type="number"
            id="mileage"
            required
            min="0"
            value={formData.mileage}
            onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
            placeholder="Ex: 50000"
          />
        </div>

        <div className="form-group">
          <label htmlFor="fuel_type">Carburant *</label>
          <select
            id="fuel_type"
            value={formData.fuel_type}
            onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
          >
            <option value="essence">Essence</option>
            <option value="diesel">Diesel</option>
            <option value="électrique">Électrique</option>
            <option value="hybride">Hybride</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="transmission">Transmission *</label>
        <select
          id="transmission"
          value={formData.transmission}
          onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
        >
          <option value="manuelle">Manuelle</option>
          <option value="automatique">Automatique</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="image_url">URL de l'image</label>
        <input
          type="url"
          id="image_url"
          value={formData.image_url}
          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          placeholder="https://example.com/car-image.jpg"
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Décrivez votre voiture..."
        />
      </div>

      <button type="submit" disabled={loading} className="submit-btn">
        {loading ? 'Ajout en cours...' : 'Poster la voiture'}
      </button>
    </form>
  );
}
