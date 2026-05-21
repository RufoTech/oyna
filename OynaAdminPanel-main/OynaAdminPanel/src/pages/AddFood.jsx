import React from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import FoodForm from '../components/FoodForm';
import { useCreateFoodMutation, useGetFoodByIdQuery, useUpdateFoodMutation } from '../store/api/foodApi';

const AddFood = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [createFood, { isLoading: isCreating }] = useCreateFoodMutation();
  const [updateFood, { isLoading: isUpdating }] = useUpdateFoodMutation();
  
  const { data: food, isLoading: isFetching } = useGetFoodByIdQuery(id, { skip: !id });

  const handleSubmit = async (foodData) => {
    try {
      if (id) {
        await updateFood({ id, ...foodData }).unwrap();
        toast.success(t('food.toasts.updateSuccess'));
      } else {
        await createFood(foodData).unwrap();
        toast.success(t('food.toasts.createSuccess'));
      }
      onNavigate('food');
    } catch (error) {
      toast.error(error?.data?.message || t('food.toasts.genericError'));
    }
  };

  if (isFetching) {
    return (
      <div className="p-8 h-full flex flex-col items-center justify-center animate-in fade-in duration-500">
        <span className="material-symbols-outlined animate-spin text-primary text-6xl mb-4">progress_activity</span>
        <h2 className="text-2xl font-bold font-headline mb-2 text-on-surface dark:text-white">{t('common.loading')}</h2>
        <p className="text-on-surface-variant dark:text-slate-400">{t('food.editSubtitle')}</p>
      </div>
    );
  }

  return (
    <FoodForm 
      key={id || "add-food"} 
      mode={id ? "edit" : "create"} 
      initialValues={food} 
      isSubmitting={isCreating || isUpdating} 
      onNavigate={onNavigate} 
      onSubmit={handleSubmit} 
    />
  );
};

export default AddFood;
