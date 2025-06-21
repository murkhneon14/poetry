import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

// Define the type for the update profile arguments
interface UpdateProfileArgs {
  username: string;
  bio?: string;
  instagram?: string;
  twitter?: string;
  profilePicture?: string | null;
}

interface ProfileEditorProps {
  user: {
    username?: string;
    email?: string;
    bio?: string;
    instagram?: string;
    twitter?: string;
    profilePicture?: string | null;
  };
  onClose: () => void;
  onSave: (updates: {
    username: string;
    bio: string;
    instagram: string;
    twitter: string;
    profilePicture?: string | null;
  }) => void;
  isDark: boolean;
}

export function ProfileEditor({ user, onClose, onSave, isDark }: ProfileEditorProps) {
  const [username, setUsername] = useState(user.username || '');
  const [bio, setBio] = useState(user.bio || '');
  const [instagram, setInstagram] = useState(user.instagram || '');
  const [twitter, setTwitter] = useState(user.twitter || '');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user.profilePicture || null);
  const [isLoading, setIsLoading] = useState(false);

  const updateProfile = useMutation(api.users.updateProfile);
  const getUploadUrl = useMutation(api.files.generateUploadUrl);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast.error('Username is required');
      return;
    }

    setIsLoading(true);
    
    try {
      let profilePictureUrl = user.profilePicture || null;
      
      // Upload new profile picture if selected
      if (profilePicture) {
        try {
          const postUrl = await getUploadUrl({});
          console.log('Upload URL:', postUrl);
          
          const result = await fetch(postUrl, {
            method: 'POST',
            headers: { 'Content-Type': profilePicture.type },
            body: profilePicture,
          });
          
          if (!result.ok) {
            const errorText = await result.text();
            console.error('Upload failed:', errorText);
            throw new Error(`Failed to upload image: ${result.status} ${result.statusText}`);
          }
          
          const { storageId } = await result.json();
          console.log('Upload successful, storageId:', storageId);
          
          if (!storageId) {
            throw new Error('No storage ID returned from upload');
          }
          
          profilePictureUrl = storageId;
          toast.success('Profile picture uploaded successfully');
        } catch (uploadError) {
          console.error('Error uploading profile picture:', uploadError);
          toast.error('Failed to upload profile picture. You can still save other changes.');
        }
      }
      
      // Update profile
      try {
        const result = await updateProfile({
          username,
          bio: bio || undefined,
          instagram: instagram || undefined,
          twitter: twitter || undefined,
          profilePicture: profilePictureUrl || undefined,
        });
        
        if (!result) {
          throw new Error('No response from server');
        }
        
        onSave({
          username,
          bio,
          instagram,
          twitter,
          profilePicture: profilePictureUrl,
        });
        
        toast.success('Profile updated successfully');
        onClose();
      } catch (updateError) {
        console.error('Error updating profile:', updateError);
        throw new Error('Failed to update profile details');
      }
    } catch (error) {
      console.error('Error in profile update:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm`}>
      <div 
        className={`w-full max-w-md rounded-2xl p-6 transform transition-all duration-300 ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Edit Profile
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-full ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
            disabled={isLoading}
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Profile Picture Upload */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                  {previewUrl ? (
                    <img 
                      src={previewUrl} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl text-gray-500">
                      👤
                    </div>
                  )}
                </div>
                <label
                  className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${
                    isDark ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'
                  } text-white`}
                >
                  <span className="text-lg">+</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isLoading}
                  />
                </label>
              </div>
            </div>
            
            {/* Username */}
            <div>
              <label 
                htmlFor="username" 
                className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                placeholder="Enter your username"
                disabled={isLoading}
                required
              />
            </div>
            
            {/* Bio */}
            <div>
              <label 
                htmlFor="bio" 
                className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                placeholder="Tell us about yourself..."
                disabled={isLoading}
              />
            </div>
            
            {/* Social Links */}
            <div className="space-y-2">
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Social Links
              </label>
              
              {/* Instagram */}
              <div className="flex items-center">
                <span className={`inline-flex items-center px-3 rounded-l-md border border-r-0 ${
                  isDark ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-500'
                } text-sm`}>
                  @
                </span>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-r-lg border ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                  placeholder="instagram"
                  disabled={isLoading}
                />
              </div>
              
              {/* Twitter */}
              <div className="flex items-center">
                <span className={`inline-flex items-center px-3 rounded-l-md border border-r-0 ${
                  isDark ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-500'
                } text-sm`}>
                  @
                </span>
                <input
                  type="text"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-r-lg border ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                  placeholder="twitter"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  isDark 
                    ? 'text-gray-300 hover:bg-gray-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                  isDark ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'
                } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
