import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Link2, Unlink2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface LinkedAccount {
  id: string;
  linked_user_id: string;
  primary_user_id: string;
  created_at: string;
}

export function AccountLinking() {
  const { user } = useAuth();

  const { data: linkedAccounts = [], isLoading } = useQuery({
    queryKey: ["linked_accounts", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("account_links")
        .select("*")
        .or(`primary_user_id.eq.${user.id},linked_user_id.eq.${user.id}`);

      if (error) {
        toast.error("Failed to load linked accounts");
        return [];
      }

      return (data || []) as LinkedAccount[];
    },
  });

  const handleUnlink = async (linkId: string) => {
    try {
      const { error } = await supabase.from("account_links").delete().eq("id", linkId);

      if (error) throw error;

      toast.success("Account unlinked successfully");
      // Refetch accounts
      window.location.reload();
    } catch (err) {
      toast.error("Failed to unlink account");
      console.error("Unlink error:", err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Link2 className="h-4 w-4" /> Linked Accounts
        </CardTitle>
        <CardDescription>
          Manage accounts that are linked to your profile. Linked accounts share your documents and settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : linkedAccounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No linked accounts yet.</p>
        ) : (
          <div className="space-y-3">
            {linkedAccounts.map((link) => {
              const linkedUserId = link.primary_user_id === user?.id ? link.linked_user_id : link.primary_user_id;
              const isPrimary = link.primary_user_id === user?.id;

              return (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {linkedUserId}
                        {isPrimary && <Badge className="ml-2 text-xs">Primary</Badge>}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Linked {new Date(link.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <Unlink2 className="h-4 w-4 mr-1" />
                        Unlink
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Unlink Account</AlertDialogTitle>
                        <AlertDialogDescription>
                          This account will no longer have access to your shared documents and settings. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleUnlink(link.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Unlink
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-4">
          To link a new account, ask the account owner to go to their Settings → Linked Accounts and initiate the connection.
        </p>
      </CardContent>
    </Card>
  );
}
