<objective>
Implement Admin Phase 5: build the cursor-paginated UserDirectoryTable with infinite scroll,
the UserDirectoryRow status badge row, the AddUserModal backed by React Hook Form v7,
and the EditUserDrawer. Wire all four components into AdminPage with proper open/edit state.

Purpose: Delivers the core user management UX — browse all users with infinite scroll, then
add or edit users inline without leaving the admin page.
Output: 4 new components + updated AdminPage; npm build passes with 0 TS errors.
</objective>

<context>
Implementation plan (phases 5 detail):
@.prompts/012-admin-plan/admin-plan.md

Phase 4 MUST already be complete before running this prompt.
Phase 4 output (types, hooks, API functions used here):
@frontend/horusvis-react/src/api/adminApi.ts
@frontend/horusvis-react/src/stores/auth-store.tsx
@frontend/horusvis-react/src/pages/AdminPage.tsx

Task specification:
@docs/outlines/tasks/05-admin/README.md

Reference UI:
@docs/outlines/stitch_horusvis/saas_user_management/screen.png
</context>

<requirements>
1. USERDIRECTORYTABLE
   Create frontend/horusvis-react/src/components/admin/UserDirectoryTable.tsx.

   Props:
     searchTerm: string
     onEditUser: (user: UserAdminDto) => void

   Data fetching:
     const { accessToken } = useAuthStore();
     useInfiniteQuery({
       queryKey: ['admin', 'users', searchTerm],  // searchTerm included so changing it resets
       queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
         fetchAdminUsers(accessToken!, pageParam, 20),
       initialPageParam: undefined as string | undefined,
       getNextPageParam: (lastPage: PagedUsersResponse) =>
         lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
       enabled: !!accessToken,
     })

   Client-side search filter:
     const allUsers = data?.pages.flatMap(p => p.data) ?? [];
     const filtered = searchTerm.trim()
       ? allUsers.filter(u =>
           u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
           u.email.toLowerCase().includes(searchTerm.toLowerCase()))
       : allUsers;

   Infinite scroll sentinel:
     const sentinelRef = useRef<HTMLDivElement>(null);
     useEffect(() => {
       const el = sentinelRef.current;
       if (!el) return;
       const observer = new IntersectionObserver(([entry]) => {
         if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
           fetchNextPage();
         }
       });
       observer.observe(el);
       return () => observer.disconnect();
     }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

   Table layout:
     <table>
       <thead>: Username | Full Name | Email | Role | Status | Last Login | Actions
       <tbody>: {filtered.map(user => <UserDirectoryRow key={user.id} user={user} onEdit={() => onEditUser(user)} />)}
     </table>
     <div ref={sentinelRef} style={{ height: 1 }} />
     {isFetchingNextPage && <p>Loading more...</p>}
     {isLoading && <p>Loading users...</p>}
     {isError && <p>Failed to load users.</p>}

2. USERDIRECTORYROW
   Create frontend/horusvis-react/src/components/admin/UserDirectoryRow.tsx.

   Props: user: UserAdminDto; onEdit: () => void

   Status badge rules (span with inline style or className):
     'Active'    → color: white; background: green
     'Inactive'  → color: white; background: grey
     'Suspended' → color: white; background: #c0392b (red)
     other       → background: #888

   Last login: format as locale date string if non-null, else "—"
   Actions cell: <button onClick={onEdit}>Edit</button>

3. ADDUSERMODAL
   Create frontend/horusvis-react/src/components/admin/AddUserModal.tsx.

   Props: open: boolean; onClose: () => void

   Modal implementation:
     Use a basic modal pattern (do NOT introduce Radix UI or any new package).
     When open === false: return null.
     When open === true: render a full-screen semi-transparent overlay + centered card.
     Pressing Escape key or clicking overlay calls onClose.

   Role options:
     Fetch roles with useQuery(['admin', 'roles'], () => fetchAdminRoles(token)) to populate
     the Role select dropdown. Display role.roleName; submit role.roleCode.

   React Hook Form v7:
     type FormValues = { username: string; email: string; fullName: string; password: string; roleCode: string; }
     const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
       defaultValues: { username: '', email: '', fullName: '', password: '', roleCode: 'user' }
     });

   Fields with validation:
     username: required, minLength 3, maxLength 50
     email: required, pattern email regex
     fullName: required
     password: required, minLength 8
     roleCode: required (select — default 'user')

   Inline error messages: render <span>{errors.field?.message}</span> below each field.

   Submit handler:
     const onSubmit = handleSubmit(async (values) => {
       await createAdminUser(values, accessToken!);   // from adminApi.ts
       queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
       toast.success('User created');                 // from sonner
       reset();
       onClose();
     });
     Wrap in try/catch; on error: toast.error('Failed to create user').
     isSubmitting: disable submit button + show "Saving…" label.

4. EDITUSERDRAWER
   Create frontend/horusvis-react/src/components/admin/EditUserDrawer.tsx.

   Props: user: UserAdminDto | null; onClose: () => void

   Drawer implementation:
     When user === null: return null.
     Render a slide-in panel (position: fixed, right: 0, top: 0, height: 100vh, width: 400px).
     Semi-transparent overlay on the left side; clicking it calls onClose.

   React Hook Form v7:
     type FormValues = { fullName: string; email: string; status: string; roleCode: string; }
     useEffect: reset(values) when user prop changes (so drawer re-populates on different user).

   Fields:
     fullName: required
     email: required, pattern email
     status: select — options: Active, Inactive, Suspended
     roleCode: select — options from useQuery(['admin', 'roles']) same as AddUserModal

   Submit handler:
     await updateAdminUser(user.id, values, accessToken!);
     queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
     toast.success('User updated');
     onClose();
     Wrap in try/catch; on error: toast.error('Failed to update user').

5. WIRE INTO ADMINPAGE
   Update frontend/horusvis-react/src/pages/AdminPage.tsx:

   Add state:
     const [addOpen, setAddOpen] = useState(false);
     const [editUser, setEditUser] = useState<UserAdminDto | null>(null);

   Replace the "user-directory" placeholder section with:
     <section data-section="user-directory">
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <h2>Users</h2>
         <button onClick={() => setAddOpen(true)}>Add User</button>
       </div>
       <UserDirectoryTable searchTerm={searchTerm} onEditUser={setEditUser} />
     </section>

   Add at page root (outside sections):
     <AddUserModal open={addOpen} onClose={() => setAddOpen(false)} />
     <EditUserDrawer user={editUser} onClose={() => setEditUser(null)} />
</requirements>

<implementation>
- Import types from adminApi.ts (UserAdminDto, PagedUsersResponse, etc.)
- Import useAuthStore from ../stores/auth-store (or appropriate relative path)
- Import useInfiniteQuery, useQuery, useMutation, useQueryClient from @tanstack/react-query
- Import useForm from react-hook-form
- Import { toast } from sonner
- Do NOT install any new packages
- Do NOT use Radix UI, Headless UI, or any dialog/drawer library — plain React + CSS only
- Modal and drawer CSS can be inline styles for simplicity; no CSS modules or Tailwind required
- TanStack Query v5 API: `getNextPageParam` receives `(lastPage, allPages, lastPageParam)`
  but the plan signature only needs `lastPage` — match the plan exactly
- queryClient.invalidateQueries in v5 takes `{ queryKey: [...] }` object form
</implementation>

<output>
Create/modify these files:

frontend/horusvis-react/src/:
- `components/admin/UserDirectoryTable.tsx` — NEW: infinite scroll table
- `components/admin/UserDirectoryRow.tsx` — NEW: row with status badge
- `components/admin/AddUserModal.tsx` — NEW: React Hook Form v7 create form
- `components/admin/EditUserDrawer.tsx` — NEW: React Hook Form v7 edit form
- `pages/AdminPage.tsx` — wire in directory table, add/edit controls, modal state
</output>

<verification>
Before declaring complete:
1. Run: cd frontend/horusvis-react && npm run build
   → Must exit 0 with zero TypeScript errors
2. Confirm UserDirectoryTable uses useInfiniteQuery with getNextPageParam returning nextCursor
3. Confirm IntersectionObserver cleanup (observer.disconnect) in useEffect return
4. Confirm AddUserModal: useForm with all 5 fields, toast.success on success, reset() + onClose()
5. Confirm EditUserDrawer: useEffect resets form when `user` prop changes
6. Confirm AdminPage: addOpen state, editUser state, "Add User" button, both modal+drawer rendered
7. No any-typed values (use proper types from adminApi.ts)
</verification>

<summary_requirements>
Create `.prompts/014-admin-user-directory-do/SUMMARY.md`

Template:
# Admin User Directory — SUMMARY
**{one-liner}**

## Version
v1

## Key Findings
- {components built}
- {RHF v7 patterns used}
- {query patterns}

## Files Created
- list all created/modified files

## Decisions Needed
None

## Blockers
{build errors if any, or None}

## Next Step
Run Phase 6: `015-admin-panels-do.md`
</summary_requirements>

<success_criteria>
- UserDirectoryTable: useInfiniteQuery + IntersectionObserver sentinel
- UserDirectoryRow: status badges (Active=green, Inactive=grey, Suspended=red)
- AddUserModal: plain overlay modal, RHF v7, all 5 fields with validation, toast on success/error
- EditUserDrawer: slide-in panel, RHF v7, useEffect re-populates on user change, toast
- AdminPage: Add User button → addOpen; onEditUser → editUser; both components rendered
- `npm run build` passes with 0 TS errors
- SUMMARY.md at .prompts/014-admin-user-directory-do/SUMMARY.md
</success_criteria>
