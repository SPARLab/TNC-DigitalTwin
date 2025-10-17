CSV and Excel exported from Google Sheet with comments associated with cells, in addition to the notes
in the "Notes" column.

I did a manual test to look for bugs and UI issues on Friday, Oct 17th, 2025.

I specifically looked at Feature Services and Image Services. I didn't really look at Hug Pages.
Hub Pages are technically included in the UI, but we can figure that out later. The Pages need
to be categorized, but, again, low priority, we can sort that out later.

The numerous bugs indicate to me that a thorough automated UI testing system needs to be implemented.
As we go, we may end up implementing UI fixes that lead to regressions. For peace of mind, I want to use Playwright. This is important:
We are NOT making this mobile-friendly. This is desktop only. I'd like to focus on "end-to-end" tests that focus a set of "clicks" and
then looking at the output.
I am, however, worried about writing tests in a way that break on any major UI changes.

We can make sure things work at a single desktop screen size for now.

It's going to be important to determine which bugs are related to improperly ingesting the data,
versus which bugs are due to issues with the metadata that TNC is giving us with their API.

I also need the bugs and issues to be categorized and then put into a to do list.

Some of the to do's are issues we can fix ourselves.

Some of them are not and require communication with TNC. I'd prefer to figure out what we can do ourselves first.

The goal here is to have some sort of an SOP for ingesting ArcGIS layer info and giving a good
preview in our "digital catalog", so this website can be a one-stop shop for ALL Digital Catalog
data.

I think we should use Playwright.

And I'm worried about having like... superfluous tests. I basically just want a bunch of end-to-end tests using playwright that clearly test these different columns in the CSV. I'd prefer end-to-end tests using Playwright that work on each data item in our CSV that are either Feature Services or Image Services.

1. Shows Up In All Categories -> Easy
2. All Layers Load ArcGIS -> Pixel detection / Click coordinates + Tooltip Presence Check
3. Download Link Works -> Check for loading spinner -> If no loading spinner, check you didn't get a "404 Not Found". Will have to use 
4. Description Matches Website -> Fix the issue where the right sidebar description omits the first paragraph. Then we should be good.
5. Tooltips Pop-Up -> Can knock out this one and 5 at the same time.
6. Legend Exists -> Easy on-screen check.
7. Legend Labels Descriptive -> If numerical units, check for alphabet characters as well.
8. Legend Filters Work -> Will require capturing manual clicks in the side-bar, unless we can simulate those clicks and dynamically check if certain polygons are no longer visible (in a way that doesn't give a false positive or false negative).

It'd be nice if we could write generalized "end-to-end testing functions" that test each of these 7 points using Playwright.
1 seems pretty easy, for example.
2 seems a bit challenging. We'd need a way to detect if the layer is visible on the screen. Speaking of which,
this may require having some sort of testing code that like tracks "user interactions" with the page, where I could open up
some sort of a test window, enter a few actions manually, and then maybe like... screenshot the specific part of the window
so we can do like a pixel-by-pixel comparison, or something like that. Not sure. Especially since we're drawing in an ArcGIS
canvas. Not sure what the best practice is here.

But again, peace of mind means, I want to simulate an actual user interacting with the website, doing certain things, and getting
certain desired results. And also, since there may be a bunch of new incoming ArcGIS layers, it'd be nice if I had testing functions
already written that made it easy to write tests for these new Feature Services and Image Services.

These are the main actions I care about.

Oh! We also have some categorization issues.