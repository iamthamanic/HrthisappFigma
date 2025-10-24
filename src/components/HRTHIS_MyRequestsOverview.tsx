/**
 * HRTHIS_MyRequestsOverview Component
 * 
 * Displays leave requests in a table with:
 * - Filtering by status (ALL, PENDING, APPROVED, REJECTED)
 * - User info (name, position, department)
 * - Request details (type, dates, days)
 * - Responsible approver (Zuständig)
 * - Actions (approve, reject) for authorized users
 * 
 * v4.2.4: Mobile responsive with card layout
 * v4.10.21: Component naming alignment with UI titles
 */

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { LeaveRequest, User } from '../types/database';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  Umbrella, 
  Heart, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText,
  Filter,
  Download,
  UserCheck
} from './icons/HRTHISIcons';
import { getResponsibleApprover, Approver } from '../utils/HRTHIS_leaveApproverLogic';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Skeleton } from './ui/skeleton';
import { useComponentDisplayName } from '../hooks/HRTHIS_useComponentDisplayName';

interface LeaveRequestWithUser extends LeaveRequest {
  user?: User;
  approver?: User;
}

interface MyRequestsOverviewProps {
  requests: LeaveRequestWithUser[];
  loading: boolean;
  canApprove: boolean; // HR, ADMIN, TEAMLEAD
  onApprove: (requestId: string) => Promise<boolean>;
  onReject: (requestId: string) => Promise<boolean>;
}

export default function MyRequestsOverview({
  requests,
  loading,
  canApprove,
  onApprove,
  onReject,
}: MyRequestsOverviewProps) {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [approvers, setApprovers] = useState<Record<string, Approver | null>>({});
  const [loadingApprovers, setLoadingApprovers] = useState(false);

  // Get display name from component function name
  const displayName = useComponentDisplayName(MyRequestsOverview);

  // Load responsible approvers for all requests
  useEffect(() => {
    const loadApprovers = async () => {
      if (requests.length === 0) return;
      
      setLoadingApprovers(true);
      const approverMap: Record<string, Approver | null> = {};
      
      // Load approvers for each unique user
      const uniqueUserIds = [...new Set(requests.map(r => r.user_id))];
      
      await Promise.all(
        uniqueUserIds.map(async (userId) => {
          try {
            const approver = await getResponsibleApprover(userId);
            approverMap[userId] = approver;
          } catch (error) {
            console.error(`Error loading approver for user ${userId}:`, error);
            approverMap[userId] = null;
          }
        })
      );
      
      setApprovers(approverMap);
      setLoadingApprovers(false);
    };

    loadApprovers();
  }, [requests]);

  // Filter requests by status
  const filteredRequests = requests.filter(req => {
    if (statusFilter === 'ALL') return true;
    return req.status === statusFilter;
  });

  // Type icon mapping
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'VACATION':
        return <Umbrella className="w-4 h-4" />;
      case 'SICK':
        return <Heart className="w-4 h-4" />;
      case 'UNPAID_LEAVE':
        return <Calendar className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // Type label mapping
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'VACATION':
        return 'Urlaub';
      case 'SICK':
        return 'Krankmeldung';
      case 'UNPAID_LEAVE':
        return 'Unbezahlte Abwesenheit';
      default:
        return type;
    }
  };

  // Status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Ausstehend
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Genehmigt
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Abgelehnt
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Stats (for filter dropdown counts)
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'PENDING').length,
    approved: requests.filter(r => r.status === 'APPROVED').length,
    rejected: requests.filter(r => r.status === 'REJECTED').length,
  };

  return (
    <div className="space-y-6">
      {/* Filters & Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <CardTitle>{displayName}</CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="leave-filter-all" value="ALL">Alle ({stats.total})</SelectItem>
                  <SelectItem key="leave-filter-pending" value="PENDING">Ausstehend ({stats.pending})</SelectItem>
                  <SelectItem key="leave-filter-approved" value="APPROVED">Genehmigt ({stats.approved})</SelectItem>
                  <SelectItem key="leave-filter-rejected" value="REJECTED">Abgelehnt ({stats.rejected})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <Alert>
              <AlertDescription>
                {statusFilter === 'ALL'
                  ? 'Keine Anträge vorhanden'
                  : `Keine ${statusFilter === 'PENDING' ? 'ausstehenden' : statusFilter === 'APPROVED' ? 'genehmigten' : 'abgelehnten'} Anträge`}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Desktop Table - Hidden on Mobile */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mitarbeiter</TableHead>
                      <TableHead>Art</TableHead>
                      <TableHead>Zeitraum</TableHead>
                      <TableHead>Tage</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Zuständig</TableHead>
                      <TableHead>Erstellt</TableHead>
                      {canApprove && <TableHead className="text-right">Aktionen</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map(request => {
                      const user = request.user;
                      const initials = user 
                        ? `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`
                        : '??';

                      return (
                        <TableRow key={request.id}>
                        {/* User */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={user?.profile_picture || undefined} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {user?.first_name} {user?.last_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user?.position || 'Keine Position'}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Type */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(request.type)}
                            <span>{getTypeLabel(request.type)}</span>
                          </div>
                        </TableCell>

                        {/* Period */}
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {format(parseISO(request.start_date), 'dd.MM.yyyy', { locale: de })}
                            </span>
                            <span className="text-sm text-gray-500">
                              bis {format(parseISO(request.end_date), 'dd.MM.yyyy', { locale: de })}
                            </span>
                          </div>
                        </TableCell>

                        {/* Days */}
                        <TableCell>{request.days_count}</TableCell>

                        {/* Status */}
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {getStatusBadge(request.status)}
                            {request.reviewed_by && (
                              <span className="text-xs text-gray-500">
                                von {request.approver?.first_name} {request.approver?.last_name}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Responsible Approver */}
                        <TableCell>
                          {loadingApprovers ? (
                            <Skeleton className="h-4 w-24" />
                          ) : approvers[request.user_id] ? (
                            <div className="flex items-center gap-2">
                              <UserCheck className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">
                                {approvers[request.user_id]?.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Kein Zuständiger</span>
                          )}
                        </TableCell>

                        {/* Created */}
                        <TableCell>
                          <span className="text-sm text-gray-500">
                            {format(parseISO(request.created_at!), 'dd.MM.yyyy', { locale: de })}
                          </span>
                        </TableCell>

                        {/* Actions */}
                        {canApprove && (
                          <TableCell className="text-right">
                            {request.status === 'PENDING' && (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 border-green-600 hover:bg-green-50"
                                  onClick={() => onApprove(request.id)}
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                  Genehmigen
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                  onClick={() => onReject(request.id)}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Ablehnen
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View - Shown only on Mobile */}
              <div className="md:hidden space-y-4">
                {filteredRequests.map(request => {
                  const user = request.user;
                  const initials = user 
                    ? `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`
                    : '??';

                  return (
                    <Card key={request.id}>
                      <CardContent className="p-4 space-y-3">
                        {/* User Info */}
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={user?.profile_picture || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium">
                              {user?.first_name} {user?.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user?.position || 'Keine Position'}
                            </div>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>

                        {/* Request Details */}
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(request.type)}
                            <span className="font-medium">{getTypeLabel(request.type)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Zeitraum:</span>
                            <span className="font-medium">
                              {format(parseISO(request.start_date), 'dd.MM.yyyy', { locale: de })} - 
                              {format(parseISO(request.end_date), 'dd.MM.yyyy', { locale: de })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Tage:</span>
                            <span className="font-medium">{request.days_count}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Erstellt:</span>
                            <span>{format(parseISO(request.created_at!), 'dd.MM.yyyy', { locale: de })}</span>
                          </div>
                          {approvers[request.user_id] && (
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Zuständig:</span>
                              <span>{approvers[request.user_id]?.name}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        {canApprove && request.status === 'PENDING' && (
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => onApprove(request.id)}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Genehmigen
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => onReject(request.id)}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Ablehnen
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
