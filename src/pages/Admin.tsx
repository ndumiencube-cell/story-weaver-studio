import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  BookOpen,
  TrendingUp,
  BarChart3,
  ArrowLeft,
  RefreshCw,
  Clock,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

interface UserStats {
  id: string;
  email: string;
  books_count: number;
  created_at: string;
  last_activity?: string;
}

interface AppStats {
  total_users: number;
  total_books: number;
  avg_books_per_user: number;
  new_users_this_week: number;
}

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserStats[]>([]);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const ADMIN_EMAIL = "admin@storyweaver.com"; // Change this to your admin email

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user is admin
      if (user.email !== ADMIN_EMAIL) {
        toast.error("Access denied: Admin access required");
        navigate("/");
        return;
      }

      await loadAdminData();
    };

    checkAdminAccess();
  }, [user, navigate]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // Get all users and their book counts
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) throw authError;

      // Get audiobooks data
      const { data: audiobooks, error: booksError } = await supabase
        .from("audiobooks")
        .select("user_id");

      if (booksError) throw booksError;

      // Calculate stats
      const booksByUser = audiobooks?.reduce((acc: any, book: any) => {
        acc[book.user_id] = (acc[book.user_id] || 0) + 1;
        return acc;
      }, {}) || {};

      const userStats: UserStats[] = (authUsers?.users || []).map((u: any) => ({
        id: u.id,
        email: u.email || "No email",
        books_count: booksByUser[u.id] || 0,
        created_at: u.created_at,
        last_activity: u.last_sign_in_at,
      }));

      setUsers(userStats);

      const totalBooks = audiobooks?.length || 0;
      const totalUsers = (authUsers?.users || []).length;
      const avgBooks = totalUsers > 0 ? (totalBooks / totalUsers).toFixed(2) : "0";

      // Calculate new users this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const newUsersThisWeek = (authUsers?.users || []).filter(
        (u: any) => new Date(u.created_at) > oneWeekAgo
      ).length;

      setStats({
        total_users: totalUsers,
        total_books: totalBooks,
        avg_books_per_user: parseFloat(avgBooks as string),
        new_users_this_week: newUsersThisWeek,
      });
    } catch (error) {
      console.error("Admin data load error:", error);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAdminData();
    setIsRefreshing(false);
    toast.success("Admin data refreshed!");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            <Badge className="ml-auto">🔒 Admin Only</Badge>
          </div>
          <p className="text-muted-foreground">Monitor app usage and user statistics</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <div className="animate-spin">
                <RefreshCw className="w-8 h-8 text-primary mx-auto" />
              </div>
              <p className="text-muted-foreground">Loading admin data...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Grid */}
            {stats && (
              <div className="grid md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      Total Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats.total_users}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.new_users_this_week} new this week
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" />
                      Total Books
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats.total_books}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Audiobooks published
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Avg. Books/User
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats.avg_books_per_user}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Books per user
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      Engagement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {stats.total_users > 0 
                        ? ((stats.total_books / stats.total_users) * 100).toFixed(0)
                        : "0"}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Books per user %
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Users Table */}
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Active Users ({users.length})
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr className="text-muted-foreground text-xs font-medium">
                        <th className="text-left py-3 px-4">Email</th>
                        <th className="text-center py-3 px-4">Books</th>
                        <th className="text-left py-3 px-4">Joined</th>
                        <th className="text-left py-3 px-4">Last Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(userStat => (
                        <tr key={userStat.id} className="border-b hover:bg-muted/50 transition">
                          <td className="py-3 px-4 font-medium text-sm">{userStat.email}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant="outline">{userStat.books_count}</Badge>
                          </td>
                          <td className="py-3 px-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(userStat.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-xs text-muted-foreground">
                            {userStat.last_activity
                              ? new Date(userStat.last_activity).toLocaleDateString()
                              : "Never"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
