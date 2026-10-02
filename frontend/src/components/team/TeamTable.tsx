import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { OrgMemberDto } from '../../types/api';
import { useIconColor } from '../../hooks/use-icon-color';

interface TeamTableProps {
  data: OrgMemberDto[];
  onRemove: (member: OrgMemberDto) => void;
  currentUserRole?: string;
  profileId?: string;
  onRoleChange: (member: OrgMemberDto, newRole: string) => void;
}

export default function TeamTable({
  data,
  onRemove,
  currentUserRole,
  profileId,
  onRoleChange,
}: TeamTableProps) {
  const adminCount = data.filter((m) => m.role?.toLowerCase() === 'admin').length;
  const ic = useIconColor();

  return (
    <View className="w-full">
      <View className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {data.map((member, index) => {
          const isAdmin = member.role?.toLowerCase() === 'admin';
          const canManage = currentUserRole === 'admin' && member.userId !== profileId;

          return (
            <View
              key={member.userId || index}
              className={`flex-row items-center justify-between px-4 py-4 ${
                index !== 0 ? 'border-t border-border' : ''
              }`}
            >
              <View className="flex-row items-center flex-1 pr-3">
                <Image
                  source={
                    member.picture
                      ? { uri: member.picture }
                      : require('../../../assets/images/icon.png')
                  }
                  className="h-10 w-10 rounded-full bg-muted"
                />
                <View className="ml-3 flex-1">
                  <Text className="text-sm font-semibold text-foreground truncate" numberOfLines={1}>
                    {member.name || 'Member'}
                  </Text>
                  <Text className="text-xs text-muted-foreground truncate" numberOfLines={1}>
                    {member.email}
                  </Text>
                  <View className="flex-row items-center gap-2 mt-1.5">
                    {canManage ? (
                      <TouchableOpacity
                        onPress={() => onRoleChange(member, isAdmin ? 'Member' : 'Admin')}
                        disabled={adminCount === 1 && isAdmin}
                        className={`px-2.5 py-0.5 rounded-full ${
                          isAdmin ? 'bg-green-500/20' : 'bg-muted'
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold ${
                            isAdmin ? 'text-green-700 dark:text-green-300' : 'text-foreground'
                          }`}
                        >
                          {member.role} ▾
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View
                        className={`px-2.5 py-0.5 rounded-full ${
                          isAdmin ? 'bg-green-500/20' : 'bg-muted'
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold ${
                            isAdmin ? 'text-green-700 dark:text-green-300' : 'text-foreground'
                          }`}
                        >
                          {member.role}
                        </Text>
                      </View>
                    )}

                    <Text className="text-[11px] text-muted-foreground">
                      Joined: {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : ''}
                    </Text>
                  </View>
                </View>
              </View>

              {canManage && (
                <TouchableOpacity
                  onPress={() => onRemove(member)}
                  className="p-2 rounded-lg active:bg-muted"
                  accessibilityLabel="Remove Member"
                >
                  <Trash2 size={18} color={ic.danger} />
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      {data.length === 0 && (
        <View className="mt-8 rounded-xl border border-dashed border-border bg-card p-8 items-center justify-center">
          <Text className="text-muted-foreground font-medium">No team members found.</Text>
        </View>
      )}
    </View>
  );
}
