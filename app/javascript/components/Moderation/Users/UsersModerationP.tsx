import I18n from 'i18n-js';

import UserEditable from './UserEditable';
import Box from '../../common/Box';
import SiteSettingsInfoBox from '../../common/SiteSettingsInfoBox';

import { UsersState } from "../../../reducers/usersReducer";
import { UserRoles, USER_STATUS_ACTIVE, USER_STATUS_BLOCKED } from "../../../interfaces/IUser";
import HttpStatus from "../../../constants/http_status";
import Spinner from "../../common/Spinner";
import React, { useCallback, useEffect, useState } from "react";

export const LocalUserRoles = {
  Admin: "admin",
  Moderator: "moderator",
  User: "user",
} as const;

export type LocalUserRoles = (typeof LocalUserRoles)[keyof typeof LocalUserRoles];

interface Props {
  users: UsersState;
  settingsAreUpdating: boolean;
  settingsError: string;

  requestUsers(): void;
  updateUserRole(id: number, role: UserRoles, authenticityToken: string): Promise<any>;
  updateUserStatus(id: number, status: typeof USER_STATUS_ACTIVE | typeof USER_STATUS_BLOCKED, authenticityToken: string): void;

  currentUserEmail: string;
  currentUserRole: UserRoles;
  authenticityToken: string;
}

const UsersModerationP: React.FC<Props> = ({
  users,
  settingsAreUpdating,
  settingsError,
  requestUsers,
  updateUserRole,
  updateUserStatus,
  currentUserEmail,
  currentUserRole,
  authenticityToken,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  useEffect(() => {
    requestUsers();
  }, [requestUsers]);

  const handleUpdateUserRole = useCallback(
    async (id: number, role: UserRoles, closeEditMode: () => void) => {
      try {
        const res = await updateUserRole(id, role, authenticityToken);
        if (res?.status === HttpStatus.OK) closeEditMode();
      } catch (error) {
        console.error("Failed to update user role", error);
      }
    },
    [updateUserRole, authenticityToken]
  );

  const handleUpdateUserStatus = useCallback(
    (id: number, status: typeof USER_STATUS_ACTIVE | typeof USER_STATUS_BLOCKED) => {
      updateUserStatus(id, status, authenticityToken);
    },
    [updateUserStatus, authenticityToken]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value);
  };

  const filteredUsers = users.items.filter((user) => {
    const matchesSearch =
      !searchQuery.trim() ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.fullName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "blocked" && user.status === USER_STATUS_BLOCKED) ||
      (statusFilter === "active" && user.status === USER_STATUS_ACTIVE);

    const matchesRole = roleFilter === "all" || user.role === (roleFilter as UserRoles);

    return matchesSearch && matchesStatus && matchesRole;
  });

  console.log(I18n.t('search.all_users')); // Debugging line

  return (
    <>
      <Box>
        <h2>{I18n.t("moderation.users.title")}</h2>

        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <input
            type="text"
            className="form-control"
            placeholder={I18n.t('search.placeholder')}
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <div className="select-wrapper">

            <select className="selectPicker" style={{ width: "auto" }} value={statusFilter} onChange={handleStatusChange}>
              <option value="all">{I18n.t('search.all_users')}</option>
              <option value="active">{I18n.t('search.active_users')}</option>
              <option value="blocked">{I18n.t('search.blocked_users')}</option>
            </select>
          </div>
          <select className="selectPicker" style={{ width: "auto" }} value={roleFilter} onChange={handleRoleChange}>
            <option value="all">{I18n.t('search.all_roles')}</option>
            <option value={LocalUserRoles.Admin}>{I18n.t('search.admin')}</option>
            <option value={LocalUserRoles.Moderator}>{I18n.t('search.moderator')}</option>
            <option value={LocalUserRoles.User}>{I18n.t('search.user')}</option>
          </select>
        </div>

        <p className="userCount">
          {filteredUsers.length} {I18n.t("activerecord.models.user", { count: filteredUsers.length })}
        </p>

        <ul className="usersList">
          {!users.areLoading ? (
            filteredUsers.map((user) => (
              <UserEditable
                key={user.id}
                user={user}
                updateUserRole={handleUpdateUserRole}
                updateUserStatus={handleUpdateUserStatus}
                currentUserEmail={currentUserEmail}
                currentUserRole={currentUserRole}
              />
            ))
          ) : (
            <Spinner />
          )}
        </ul>
      </Box>

      <SiteSettingsInfoBox areUpdating={settingsAreUpdating || users.areLoading} error={settingsError} />
    </>
  );
};

export default UsersModerationP;