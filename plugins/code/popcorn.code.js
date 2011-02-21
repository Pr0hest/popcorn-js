// PLUGIN: Code

(function (Popcorn) {

  /**
   * Code Popcorn Plug-in
   *
   * Adds the ability to run arbitrary code (JavaScript functions) according to video timing.
   *
   * @param {Object} options
   *
   * Required parameters: start, end, template, data, and target.
   * Optional parameter: static.
   *
   *   start: the time in seconds when the mustache template should be rendered
   *          in the target div.
   *
   *   end: the time in seconds when the rendered mustache template should be
   *        removed from the target div.
   *
   *   onStart: the function to be run when the start time is reached.
   *
   *   onFrame: [optional] a function to be run on each paint call
   *            (e.g., called ~60 times per second) between the start and end times.
   *
   *   onEnd: [optional] a function to be run when the end time is reached.
   *
   * Example:
     var p = Popcorn('#video')

        // onStart function only
        .code({
          start: 1,
          end: 4,
          onStart: function( options ) {
            // called on start
          }
        })

        // onStart + onEnd only
        .code({
          start: 6,
          end: 8,
          onStart: function( options ) {
            // called on start
          },
          onEnd: function ( options ) {
            // called on end
          }
        })

        // onStart, onEnd, onFrame
        .code({
          start: 10,
          end: 14,
          onStart: function( options ) {
            // called on start
          },
          onFrame: function ( options ) {
            // called on every paint frame between start and end.
            // uses mozRequestAnimationFrame, webkitRequestAnimationFrame,
            // or setTimeout with 16ms window.
          },
          onEnd: function ( options ) {
            // called on end
          }
        });
  *
  */

  Popcorn.plugin( 'code' , function() {

      function get( name, options ) {
        return options._instance[name];
      }

      function set( name, options, value ) {
        options._instance[name] = value;
      }

      // Setup a proper frame interval function (60fps), favouring paint events.
      var step = ( function() {

        var buildFrameRunner = function( runner ) {
          return function( f, options ) {

            var _f = function() {
              f();
              if ( get( 'running', options ) ) {
                runner( _f );
              }
            };

            _f();
          };
        };

        // Figure out which level of browser support we have for this
        if ( window.webkitRequestAnimationFrame ) {
          return buildFrameRunner( window.webkitRequestAnimationFrame );
        } else if ( window.mozRequestAnimationFrame ) {
          return buildFrameRunner( window.mozRequestAnimationFrame );
        } else {
          return buildFrameRunner( function( f ) {
            window.setTimeout( f, 16 );
          } );
        }

      } )();


      return {
        manifest: {
          about: {
            name: 'Popcorn Code Plugin',
            version: '0.1',
            author: 'David Humphrey (@humphd)',
            website: 'http://vocamus.net/dave'
          },
          options: {
            start: {elem:'input', type:'text', label:'In'},
            end: {elem:'input', type:'text', label:'Out'},
            // TODO: how to deal with functions, eval strings?
            onStart: {elem:'input', type:'text', label:'onStart'},
            onFrame: {elem:'input', type:'text', label:'onFrame'},
            onEnd: {elem:'input', type:'text', label:'onEnd'}
          }
        },

        _setup : function( options ) {
          if ( !options.onStart || !( typeof options.onStart === 'function' ) ) {
            throw 'Popcorn Code Plugin Error: onStart must be a function.';
          }

          if ( options.onEnd && !( typeof options.onEnd === 'function' ) ) {
            throw 'Popcorn Code Plugin Error: onEnd  must be a function.';
          }

          if ( options.onFrame && !( typeof options.onFrame === 'function' ) ) {
            throw 'Popcorn Code Plugin Error: onFrame  must be a function.';
          }

          options._instance = { running: false };
        },

        start: function( event, options ) {
          options.onStart( options );

          if ( options.onFrame ) {
            set( 'running', options, true );
            step( options.onFrame, options );
          }
        },

        end: function( event, options ) {
          if ( options.onFrame ) {
            set( 'running', options, false );
          }

          if ( options.onEnd ) {
            options.onEnd( options );
          }
        }

      };

    });

})( Popcorn );
