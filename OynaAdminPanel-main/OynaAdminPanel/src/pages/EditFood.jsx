import React, { useEffect } from 'react';
import { toast } from 'react-toastify';
import FoodForm from '../components/FoodForm';
import { useGetFoodByIdQuery, useUpdateFoodMutation } from '../store/api/foodApi';

const EditFood = ({ onNavigate, editingFoodId }) => {
  const { data: food, isLoading, isError } = useGetFoodByIdQuery(editingFoodId, {
    skip: !editingFoodId,
  });
  const [updateFood, { isLoading: isUpdating }] = useUpdateFoodMutation();

  useEffect(() => {
    if (!editingFoodId) {
      toast.error('Redakte ucun food tapilmadi.');
      onNavigate('food');
    }
  }, [editingFoodId, onNavigate]);

  useEffect(() => {
    if (isError) {
      toast.error('Food melumatlari yuklenmedi.');
      onNavigate('food');
    }
  }, [isError, onNavigate]);

  const handleUpdateFood = async (foodData) => {
    try {
      await updateFood({ id: editingFoodId, ...foodData }).unwrap();
      toast.success('Food ugurla yenilendi.');
      onNavigate('food');
    } catch (error) {
      toast.error(error?.data?.message || 'Food yenilenirken xeta bas verdi.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 h-full flex flex-col items-center justify-center animate-in fade-in duration-500">
        <span className="material-symbols-outlined animate-spin text-primary text-6xl mb-4">progress_activity</span>
        <h2 className="text-2xl font-bold font-headline mb-2 text-on-surface">Food Yuklenir...</h2>
        <p className="text-on-surface-variant">Redakte formasi hazirlanir.</p>
      </div>
    );
  }

  if (!food) {
    return null;
  }

  return (
    <FoodForm
      key={food._id}
      mode="edit"
      initialValues={food}
      isSubmitting={isUpdating}
      onNavigate={onNavigate}
      onSubmit={handleUpdateFood}
    />
  );
};

export default EditFood;
