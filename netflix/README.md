# Netflix UI Engineer takehome test

* Submission by [Jules Glegg](mailto:jules@julesfern.net)

# Development loop

```bash
npm install
npm run start
#--> now open http://localhost:8080/test
```

# Run

```bash
npm install
npm run start
#--> now open http://localhost:8080/
```

# Code attribution

* All code in `/src` and `/test` was authored by me as part of this exercise.

# Guided Tour

- `src/index.js` - the entrypoint file
- `src/app.js` - the root application object
- `src/component/*` - all the UI components
- `src/data/*` - data layer for the app
- `src/navigation/*` - libraries for handling keyboard navigation throughout the app
- `src/util/*` - utility belt stuff. JSON loaders, event dispatchers, timing functions
- `test/*` - unit tests
- `asset/*` - static asets including JSON fixtures and CSS

# Stuff I focussed on

* I focussed my energies on navigation and lists. In the end, I decided to go ahead and implement the lists as virtual/delegate components so we could dive deep on those in conversation.

# Active compromises

Things I did which are bad but, being honest, I actively decided to do them:

- I invested in unit test coverage for the component framework and navigation layer. The concrete components are lacking coverage in this example. This is a time call, not a taste call. The testing in place demonstrates that the components are workably testable in a unit harness, which is good enough for us to chat about.
- I did not invest in a robust data layer for the application - the data doesn't change. This wouldn't do in the real world, but in our case here it's just fine.

# Improvements backlog

- Base Component class is _about_ the right size to break up into a few discrete mixins
- VirtualList component could have a cleaner experience in random access use cases
- Current assumption is that only a root-level application has e.g. a navigation controller. Need to do the fiddly work of unbinding from a previous navigation controller when reparented.
- The self-bound focusNext/focusPrevious properties are debounced (yay!) but at the cost of busting the vtable for that class.
- Move UI strings out to localized strings DB
- Yo we need a linter
- Video view items could really use an asset loading lifecycle so they can show a spinner/indeterminate state under real-world network conditions
- Not happy with the position snapping on the horizontal virtual lists. Add rounding logic so they stay nicely lined up with the rows above/below.
- `Component#setData` could do some decent comparison and proc a dataChanged handler. That'd mean less diffing in `setData` implementations...
- Logging is straight-up console - a logger module with nested log streams would be beneficial