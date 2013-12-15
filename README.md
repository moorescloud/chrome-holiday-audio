Streaming Audio Visualizer for Holiday Chrome
=============================================

This Chrome app builds up the holiday-chrome code base http://github.com/moorescloud/chrome-holiday, and implements
a real-time basic visualization of the streaming Classical FM station.  

THe visualization uses the Web Audio API to do a frequency-domain analysis of the incoming stream - which is a streaming Christmas music radio station in Germany.  The visualization is also drawn to the display, so you it's possible to note the correspondence between the on-screen and Holiday based visualizations.  

In essence, the Holiday is being used as the output of a spectrum analyzer.

This code can be adapted for your own sound visualization apps for Holiday by MooresCloud.

This use the super-fast UDP-based SecretAPI, which is documented at https://github.com/moorescloud/secretapi

For more information on Holiday, visit our website at http://holiday.moorescloud.com/

Many thanks for the fine code example from Ian Reah at http://ianreah.com/2013/02/28/Real-time-analysis-of-streaming-audio-data-with-Web-Audio-API.html

Mark Pesce
mpesce@moorescloud.com
December 2013
