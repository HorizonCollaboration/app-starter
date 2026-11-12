# Horizon's kit

Every screen is built from these components, so every Horizon app looks properly designed and works well on a phone. They're the same components prototypes use, made for Next.js: tabs are real pages, and fields work in forms that are sent to the server.

Import them from `@/kit`, never from `@/kit/ui` or anywhere else: `import { AppShell, Button, List, Row } from "@/kit"`. Icons come from Lucide: `import { Store } from "lucide-react"`. `src/kit/` is fixed: don't change it.

The look is black, white and grey, and colour only ever means something: a tag's dot (urgent, running low, done) or a message. Don't style colours, borders, shadows or corners yourself: the kit does that. Use Tailwind only for layout and spacing (`flex`, `grid`, `gap-4`, `md:grid-cols-3`) and plain text sizes. Never write your own buttons, cards, tags, fields or navigation.

## The app

Make one `AppShell` component of your own in `src/components/` (with the app's name, tabs and signing in or out), and wrap every screen in it:

```tsx
<AppShell
  name="Food bank needs" icon={HandHeart}
  current="needs"
  tabs={[
    { id: "needs", label: "What's needed", href: "/", icon: HandHeart },
    { id: "banks", label: "Food banks", href: "/food-banks", icon: Store },
    { id: "list", label: "My list", href: "/my-list", icon: ListChecks, count: 3 },
  ]}
  account={user ? <form action={signOut}><Button type="submit" variant="ghost" size="sm">Sign out</Button></form> : <Button href="/sign-in" variant="secondary" size="sm">Sign in</Button>}
>
  …the screen…
</AppShell>
```

A sidebar on a computer, a tab bar at the bottom on a phone. Add `nav="top"` for a bar across the top on a computer instead, when the brief or prototype asks for navigation along the top (the phone keeps its bottom tab bar). These are the only two layouts. An app that only does one job can leave out `tabs`.

## A screen

```tsx
<ScreenHeader icon={Store} title="Food banks" description="Follow the food banks you give to." action={<Button variant="primary" href="/food-banks/new">Add a food bank</Button>} />
<ScreenHeader back={{ label: "All food banks", href: "/food-banks" }} icon={Store} title={bank.name} description="Riverside · updated today" />
```

`ScreenHeader` holds the screen's one `h1`. `Section title="Already given"` heads a later part of a screen. Screens are a column with space between parts already.

## Lists are rows

```tsx
<List>
  {banks.map((bank) => (
    <Row
      key={bank.id}
      href={`/food-banks/${bank.id}`}
      media={<Tile icon={Store} />}
      title={bank.name}
      description="Riverside · updated today"
      actions={<FollowButton bankId={bank.id} />}
    >
      <Tag tone="urgent">2 urgent</Tag>
    </Row>
  ))}
</List>
```

`href` makes the whole row open that page, while its actions stay clickable. Use `<List framed={false}>` inside a `Card`, and `compact` rows there. Use cards for a few related things side by side, or a form, never for long lists.

## Forms

Fields take a `name` and `defaultValue`, so a form can be sent to a server action as it is:

```tsx
<form action={formAction} className="flex flex-col gap-5">
  <Field label="Item" name="item" required maxLength={120} />
  <Select label="Type of item" name="category" required placeholder="Choose a type" options={categories.map((c) => ({ value: c, label: c }))} />
  <Segmented label="How short are they?" name="level" defaultValue="urgent" options={[{ value: "urgent", label: "Urgent" }, { value: "low", label: "Running low" }]} />
  <TextArea label="Note" hint="Optional." name="note" maxLength={200} />
  <FormMessage error={state.error} message={state.message} />
  <Button type="submit" variant="primary" disabled={pending}>Add need</Button>
</form>
```

In a client component they can be controlled instead, with `value` and `onChange` (which hands back the text or the chosen value), for filters.

## Pieces

- `Button`: `variant` primary (one per screen, the main action), secondary, outline (default), ghost, danger, link; `size` md, sm, icon, icon-sm (icon buttons need `aria-label`). `href` makes it a link to another page. Put a Lucide icon before the words when it helps.
- `Tile icon={…}`: a picture for a thing, a grey Lucide icon on a quiet white tile. `size`: sm, md, lg. Give each kind of thing its own icon, the same everywhere.
- `Tag tone="…"`: a state, with a small coloured dot for its meaning. `tone`: neutral (default), primary, urgent (red), warning (amber), good (green), info (blue); `icon` adds a Lucide icon.
- `Card title description action footer`: a box for a few related things, or a form.
- `Stat label value icon hint`: a big number for a summary, three to a row: `<div className="grid grid-cols-3 gap-2 sm:gap-3">`.
- `Field`, `TextArea`, `Select`, `Segmented`: see Forms. `Select` and `Segmented` take `options={[{ value, label }]}`, never with an empty value: use `"all"`, not `""`, for "everything". Without a visible label, give them `ariaLabel`.
- `FormMessage error message`: what a form's server action said, under the form.
- `EmptyState icon title description action`: when there's nothing yet. Always say what to do next.
- `Notice message onClose tone`: "Added milk to your list." after an action (`tone` good or problem). It needs a client component holding the message in state.

Pass Lucide icons (`icon={Store}`) only from server components or within client components: a server component can't hand an icon to a client component as a prop.
