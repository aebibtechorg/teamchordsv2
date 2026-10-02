import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useProfileStore } from '../store/useProfileStore';
import Modal from './Modal';
import { ChevronDown, Check, Plus } from 'lucide-react-native';
import { router } from 'expo-router';

interface OrgSelectorProps {
  className?: string;
}

export default function OrgSelector({ className = '' }: OrgSelectorProps) {
  const { profile, setActiveOrg } = useProfileStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      const orgs = profile.organizations || [];
      if (orgs.length > 0) {
        const active = profile.orgId || orgs[0].id;
        if (!profile.orgId && active) {
          setActiveOrg(active);
        }
      }
    }
  }, [profile, setActiveOrg]);

  if (!profile) return null;

  const orgs = profile.organizations || [];
  if (!orgs || orgs.length === 0) return null;

  const activeOrgId = profile.orgId || (orgs.length ? orgs[0].id : null);
  const activeOrg = orgs.find((o) => o.id === activeOrgId) || orgs[0];
  const profileId = profile.id;
  const ownsOrganization = orgs.some((o) => o.ownerUserId === profileId);

  return (
    <View className={`w-full ${className}`}>
      <TouchableOpacity
        onPress={() => setIsDropdownOpen(true)}
        className="flex-row items-center justify-between bg-gray-600 px-3 py-2 rounded-lg"
      >
        <Text className="text-white text-xs font-semibold truncate flex-1 mr-2" numberOfLines={1}>
          {activeOrg?.name || 'Select Team'}
        </Text>
        <ChevronDown size={14} color="#D1D5DB" />
      </TouchableOpacity>

      <Modal visible={isDropdownOpen} onClose={() => setIsDropdownOpen(false)}>
        <View className="p-4 bg-white">
          <Text className="text-lg font-bold text-gray-900 mb-3">Select Team</Text>
          <ScrollView className="max-h-60">
            {orgs.map((org) => {
              const isSelected = (org.id || '') === activeOrgId;
              return (
                <TouchableOpacity
                  key={org.id}
                  onPress={() => {
                    if (org.id) setActiveOrg(org.id);
                    setIsDropdownOpen(false);
                  }}
                  className={`flex-row items-center justify-between p-3 rounded-lg mb-1.5 ${
                    isSelected ? 'bg-gray-100' : 'active:bg-gray-50'
                  }`}
                >
                  <Text className={`text-sm ${isSelected ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                    {org.name}
                  </Text>
                  {isSelected && <Check size={16} color="#374151" />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {!ownsOrganization && (
            <TouchableOpacity
              onPress={() => {
                setIsDropdownOpen(false);
                router.push('/(app)/onboard' as any);
              }}
              className="flex-row items-center justify-center p-3 mt-2 border border-dashed border-gray-300 rounded-lg active:bg-gray-50"
            >
              <Plus size={16} color="#4B5563" />
              <Text className="text-sm font-medium text-gray-700 ml-2">Create new team</Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </View>
  );
}
