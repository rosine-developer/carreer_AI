import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { X, Plus, Save, Loader2 } from 'lucide-react';
import storageManager from '../../lib/storage-manager';
import type { ProfileData, ProfileManagerProps } from '../../types/application-helper';

// Validation schema
const profileSchema = z.object({
  personal: z.object({
    fullName: z.string().min(1, 'Full name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(1, 'Phone number is required'),
    location: z.string().min(1, 'Location is required'),
    linkedIn: z.string().optional(),
    portfolio: z.string().optional(),
  }),
  education: z.array(
    z.object({
      id: z.string(),
      schoolName: z.string().min(1, 'School name is required'),
      degree: z.string().min(1, 'Degree is required'),
      fieldOfStudy: z.string().min(1, 'Field of study is required'),
      startDate: z.string().min(1, 'Start date is required'),
      endDate: z.string(),
      current: z.boolean(),
      achievements: z.array(z.string()),
    })
  ),
  experience: z.array(
    z.object({
      id: z.string(),
      organizationName: z.string().min(1, 'Organization name is required'),
      role: z.string().min(1, 'Role is required'),
      startDate: z.string().min(1, 'Start date is required'),
      endDate: z.string(),
      current: z.boolean(),
      responsibilities: z.array(z.string()),
    })
  ),
  skills: z.array(z.string()),
  achievements: z.array(z.string()),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileManagerModal({ isOpen, onClose }: ProfileManagerProps) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [newSkill, setNewSkill] = useState('');
  const [newAchievement, setNewAchievement] = useState('');

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      personal: {
        fullName: '',
        email: '',
        phone: '',
        location: '',
        linkedIn: '',
        portfolio: '',
      },
      education: [],
      experience: [],
      skills: [],
      achievements: [],
    },
  });

  const {
    fields: educationFields,
    append: appendEducation,
    remove: removeEducation,
  } = useFieldArray({
    control,
    name: 'education',
  });

  const {
    fields: experienceFields,
    append: appendExperience,
    remove: removeExperience,
  } = useFieldArray({
    control,
    name: 'experience',
  });

  const skills = watch('skills');
  const achievements = watch('achievements');

  // Load profile data on mount
  useEffect(() => {
    if (isOpen) {
      loadProfileData();
    }
  }, [isOpen]);

  const loadProfileData = async () => {
    try {
      const profile = await storageManager.loadProfile();
      if (profile) {
        reset(profile);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setSaveStatus('saving');
    try {
      await storageManager.saveProfile(data as ProfileData);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save profile:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setValue('skills', [...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (index: number) => {
    setValue(
      'skills',
      skills.filter((_, i) => i !== index)
    );
  };

  const handleAddAchievement = () => {
    if (newAchievement.trim()) {
      setValue('achievements', [...achievements, newAchievement.trim()]);
      setNewAchievement('');
    }
  };

  const handleRemoveAchievement = (index: number) => {
    setValue(
      'achievements',
      achievements.filter((_, i) => i !== index)
    );
  };

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#0095FF]">
            Manage Your Profile
          </DialogTitle>
          <DialogDescription>
            Save your information once and reuse it across all your applications
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Personal Information */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  {...register('personal.fullName')}
                  placeholder="John Doe"
                  className="mt-1"
                />
                {errors.personal?.fullName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.personal.fullName.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('personal.email')}
                  placeholder="john@example.com"
                  className="mt-1"
                />
                {errors.personal?.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.personal.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  {...register('personal.phone')}
                  placeholder="+1 (555) 123-4567"
                  className="mt-1"
                />
                {errors.personal?.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.personal.phone.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  {...register('personal.location')}
                  placeholder="New York, NY"
                  className="mt-1"
                />
                {errors.personal?.location && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.personal.location.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="linkedIn">LinkedIn (optional)</Label>
                <Input
                  id="linkedIn"
                  {...register('personal.linkedIn')}
                  placeholder="linkedin.com/in/johndoe"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="portfolio">Portfolio (optional)</Label>
                <Input
                  id="portfolio"
                  {...register('personal.portfolio')}
                  placeholder="johndoe.com"
                  className="mt-1"
                />
              </div>
            </div>
          </section>

          {/* Education */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Education</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendEducation({
                    id: generateId(),
                    schoolName: '',
                    degree: '',
                    fieldOfStudy: '',
                    startDate: '',
                    endDate: '',
                    current: false,
                    achievements: [],
                  })
                }
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Education
              </Button>
            </div>

            {educationFields.map((field, index) => (
              <div key={field.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-gray-900">Education {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEducation(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>School Name *</Label>
                    <Input
                      {...register(`education.${index}.schoolName`)}
                      placeholder="University Name"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Degree *</Label>
                    <Input
                      {...register(`education.${index}.degree`)}
                      placeholder="Bachelor's"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Field of Study *</Label>
                    <Input
                      {...register(`education.${index}.fieldOfStudy`)}
                      placeholder="Computer Science"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Start Date *</Label>
                    <Input
                      {...register(`education.${index}.startDate`)}
                      type="month"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>End Date</Label>
                    <Input
                      {...register(`education.${index}.endDate`)}
                      type="month"
                      className="mt-1"
                      disabled={watch(`education.${index}.current`)}
                    />
                  </div>

                  <div className="flex items-center space-x-2 mt-6">
                    <input
                      type="checkbox"
                      {...register(`education.${index}.current`)}
                      id={`education-current-${index}`}
                      className="w-4 h-4"
                    />
                    <Label htmlFor={`education-current-${index}`}>Currently studying here</Label>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Experience */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Experience</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendExperience({
                    id: generateId(),
                    organizationName: '',
                    role: '',
                    startDate: '',
                    endDate: '',
                    current: false,
                    responsibilities: [],
                  })
                }
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Experience
              </Button>
            </div>

            {experienceFields.map((field, index) => (
              <div key={field.id} className="p-4 border border-gray-200 rounded-lg space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-gray-900">Experience {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExperience(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Organization Name *</Label>
                    <Input
                      {...register(`experience.${index}.organizationName`)}
                      placeholder="Company Name"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Role *</Label>
                    <Input
                      {...register(`experience.${index}.role`)}
                      placeholder="Software Intern"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Start Date *</Label>
                    <Input
                      {...register(`experience.${index}.startDate`)}
                      type="month"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>End Date</Label>
                    <Input
                      {...register(`experience.${index}.endDate`)}
                      type="month"
                      className="mt-1"
                      disabled={watch(`experience.${index}.current`)}
                    />
                  </div>

                  <div className="flex items-center space-x-2 mt-6">
                    <input
                      type="checkbox"
                      {...register(`experience.${index}.current`)}
                      id={`experience-current-${index}`}
                      className="w-4 h-4"
                    />
                    <Label htmlFor={`experience-current-${index}`}>Currently working here</Label>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Skills */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                placeholder="Add a skill (e.g., JavaScript, React)"
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
              />
              <Button type="button" onClick={handleAddSkill}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <Badge key={index} variant="secondary" className="px-3 py-1">
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(index)}
                    className="ml-2 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </section>

          {/* Achievements */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
            <div className="flex gap-2">
              <Input
                value={newAchievement}
                onChange={e => setNewAchievement(e.target.value)}
                placeholder="Add an achievement"
                onKeyPress={e =>
                  e.key === 'Enter' && (e.preventDefault(), handleAddAchievement())
                }
              />
              <Button type="button" onClick={handleAddAchievement}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {achievements.map((achievement, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-800 rounded"
                >
                  <span className="text-sm">{achievement}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAchievement(index)}
                    className="hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <div>
              {saveStatus === 'saved' && (
                <p className="text-green-500 text-sm">Profile saved successfully!</p>
              )}
              {saveStatus === 'error' && (
                <p className="text-red-500 text-sm">Failed to save profile. Please try again.</p>
              )}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#0095FF] hover:bg-[#0095FF]/90"
                disabled={saveStatus === 'saving'}
              >
                {saveStatus === 'saving' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}




