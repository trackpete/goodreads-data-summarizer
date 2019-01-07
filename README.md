# Goodreads Data Summarizer

I wanted to summarize some information about the books I've read,
which leads us to this. It's an experimental work in progress at
this moment and I've no idea if it'll work for anyone else. ;)

# Notes

1. the reviews list API seems to be the only effective way to get books from my read shelf
2. the API is XML and can be parsed into an object with xml2js but there are arrays as a result
3. the API is missing a *ton* of information, has fields for stuff like page numbers/etc. but they aren't populated
4. shelves API doesn't seem to return ASIN or any category information on the books. Perusing goodreads APIs, it seems like they don't offer any good detailed book information.
5. Going to need to find a way to look up individual book data on Amazon for categories/etc. Probably want Amazon rating anyway.
6. https://docs.aws.amazon.com/AWSECommerceService/latest/DG/CHAP_GettingStarted.html this is kinda bonkers and excessive to just want to get some book information.
7. Signed up to affiliate program, now they say "Start advertising on your site: You must drive at least three qualified sales within 180 days in order to avoid termination of your Associate account."
"Once we have emailed you confirming your application has been reviewed and you have been accepted into the Associates Program, you will be able to access PA API. " Thanks. Great. So I can't even use this.
8. review.book.id = goodreads ID. Send this to book show API (i.e. https://www.goodreads.com/book/show/42969396.xml) and it returns kindle ASIN. https://amazon.com/dp/ASIN gives you the Amazon web page.
9. Since the goodreads API is extremely rate limited, I need to make sure to do these calls synchronously with a delay. Wee. This is one of the minor annoyances I find working with node sometimes, even though usually async is way better.
10. Decided to change my methodology a bit - start by focusing on pulling in data and saving it, then worry about processing it later from a db. 1s delay between requests will waste too much time to dev + tweak on realtime data.
11. After working through ensuring only one book was requested at time and the API wasn't spammed, I ran a first pull!
12. Great, some books on Goodreads don't have ASINs for Amazon even though they're listed on Amazon. Ok? I didn't expect this.
13. Looks like the above happens when a new goodreads id is created for a book. Possibly can be found via work.best_book_id? Checked - nope, sometimes that leads to hardcover. Hrm. Seems like the easiest way to solve this long term is to manually go through the ~15 or so books on gr and switch the editions on my shelf, then re-run.
14. Some of the GR books with ASINs point to old ASINs so I have to update all of those on GR too. Noice.
15. Whoah I found some books that weren't available anymore! Weird. Ignoring those.
16. Got everything loaded into local dbs, messing with extraction into a table for querying
17. Just realized I'm running code/tests on ubuntu-on-windows and it uses node8 instead of the version of node10 I have installed on windows (duh), which explains why I've been seeing some weird es6 errors attempting various things. Fixing this!
18. First up realized how many books on the goodreads api don't have working thumbnails. This is weird since they have them on the main page for the book. Another example of their APIs being out of date. Gotta pull these from AMZ.
19. 

