showPreview = true
let p = await args.widgetParameter

//########## SETUP ###########

// Your name
let USER = "Marc"

// Your city (for weather)
let CITY = "Stein"

// Get free api_key from https://openweathermap.org
const api_key = ""

// Specify calendars and remidner-lists, leave empty for all
let CALENDARS = ["Privat", "Arbeit", "Geburtstage"]
let REMINDERS = []

// If set to false, a random greeting from the list below will be chosen
let TIME_BASED_GREETING = true
let GREETINGS = ["Servus", "Hi", "Hey", "Hallo", "Moin"]

let SHOW_GREETING = true
let SHOW_QUOTE = true

// How many reminders and events should be displayed? (max. 7)
let R_COUNT = 7
let E_COUNT = 7 // Calendar events

// Show white translucent box?
let GREET_BOX = false
let WEATHER_BOX = true
let DEVICE_BOX = true
let QUOTE_BOX = true
let R_BOX = true
let E_BOX = true

// If true, you will need the telekom module (telekom-module.js)
let SHOW_TELEKOM = false

// Background Image (image: "Scriptable/welcome_widget_background_image/")
let CUSTOM_IMAGE = false
let IMAGE_NAME = "image.jpg"

// Gradient will be used if you dont want to use a custom image
let GRADIENT_C_1 = new Color("#a2a2a2") 
let GRADIENT_C_2 = new Color("#c3c3c3")
let GRADIENT_L = [0, 1]

let ORDER = []


// iPhone 11 Pro (need map function)
let width = 329
let height = 345
let padding = 10

let space = 11

let title_font = Font.regularRoundedSystemFont(20)
let list_font = Font.regularRoundedSystemFont(13)

let box_corner_radius = 10.0
let box_color = new Color("#ffffff", 0.4)
let box_size = new Size((width - padding*3) / 2, 0)



// ########## END SETUP #########

const telekom = importModule("telekom-module.js")

let url = "http://api.openweathermap.org/data/2.5/weather?q="+CITY+"&units=metric&appid="+ api_key

let quote_url = "https://www.brainyquote.com/quote_of_the_day"


var df = new DateFormatter()
df.useShortDateStyle()

let fm = FileManager.iCloud()
var path = fm.joinPath(fm.documentsDirectory(), "welcome_widget_background_image")

if(!fm.isDirectory(path)){
  fm.createDirectory(path)
  console.log("Create")
}else{
  //console.log("Path exists")
}




// HELPER CLASS
class Object{
  constructor(title, date, color){
    this.title = title
    this.date = date
    this.color = color
  }
}


// HELPER FUNCTION TO SORT REMINDERS BY DATE  
var date_sort_desc = function (date1, date2) {
  if (date1.creationDate > date2.creationDate) return -1;
  if (date1.creationDate < date2.creationDate) return 1;
  return 0;
};


// HELPER FUNCTION TO ROUND NUMBERS TO TWO DECIMAL PLACES
function round(num){
  return Math.round((num + Number.EPSILON) * 100) / 100
}

// HELPER FUNCTION TO CONVERT STRING TO CALENDAR
async function getCalendars(c, cr){
  calendars = []
  for(var i=0; i < c.length; i++){
    if(cr == "calendar"){
      calendars.push(await Calendar.forEventsByTitle(c[i]))
    }else if(cr == "reminder"){
      calendars.push(await Calendar.forRemindersByTitle(c[i]))
    }
  }
  return calendars
}



// ############## FUNCTIONS FOR DATA PROCESSING ###########
function getHourTime(){
  now = new Date(Date.now())
  return now.getHours()
}

function getDaysHours(event){
  now = new Date(Date.now())
  date = event.date
  hours_total = (date - now) / 1000 / 60 / 60
  hours = hours_total%24
  days = (hours_total - hours) / 24
  return ((days > 0) ? days + "d " : "") + Math.round(hours) + "h"
}

function getProcessedDate(){
  now = new Date(Date.now())
  day = now.getDate()
  month = now.getMonth()
  week_day = now.getDay()
  days = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"]
  months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"]
  day_str = days[week_day] + " " + day + ". " + months[month] 
  return day_str
}

function getGreeting(){
  hour = getHourTime()
  greeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)]
  if(TIME_BASED_GREETING){
    if(hour > 21 || hour < 5){
      greeting = "Gute Nacht"
    }else if(hour > 4 && hour < 11){
      greeting = "Guten Morgen"
    }else if(hour > 17 && hour < 22){
      greeting = "Guten Abend"
    }else{
      greeting = "Guten Tag"
    }
  }
  return greeting
}

function getWeatherCond(weather){
  hour = getHourTime()
  cond = "⛅️"
  // Make switch statement
  if(weather == "Clear"){ 
    if(hour > 20 || hour < 6){
      cond = "🌗"
    }else{
      cond = "☀️"
    }
  }else if(weather == "Rain"){
    cond = "🌧"
  }else if(weather == "Clouds"){
    cond = "🌥"
  }else if(weather == "Fog"){
    cond = "🌫"
  }else if(weather == "Drizzle"){
    cond = "🌦"
  }else {
    cond = weather
  }
  return cond
}

function getTimeForSun(sun, data){
  now = Date.now()
  sun_str = "Unknow"
  if(sun == "set"){
    sunset = new Date(data.sys.sunset * 1000)
    sun_str = sunset.toLocaleTimeString("de", {hour: '2-digit', minute: '2-digit'})
  }else if(sun == "rise"){
    sunrise = new Date(data.sys.sunrise * 1000)
    sun_str = sunrise.toLocaleTimeString("de", {hour: '2-digit', minute: '2-digit'})
  }
  return sun_str
}



// ############# GET DATA #################

async function getQuote(){
  let webview = new WebView()
  await webview.loadURL(quote_url)
  var getData = `
    function getData(){
        var x = document.getElementsByClassName("b-qt oncl_q")
        return x[0].innerText
      } 

    getData()
  `
  let quote = await webview.evaluateJavaScript(getData, false)
  return quote
}

async function getWeather(){
  let r = new Request(url)
  let data = await r.loadJSON()
  return data
}

async function getObjectsFor(app){
  objects = ""
  objects_processed = []  
  
  if(app == "reminder"){
    reminders = await getCalendars(REMINDERS, 'reminder')
    objects = await Reminder.allIncomplete(reminders)
    objects = objects.sort(date_sort_desc);  
  }else if (app == "calendar"){
    calendars = await getCalendars(CALENDARS, 'calendar')
    startDate = new Date(Date.now() + (1000 * 60 * 60 * 23))
    s = Date.now() + 1000*60*60*24*15
    endDate = new Date(s)
    objects = await CalendarEvent.between(startDate, endDate, calendars)  
  }
  
  for(object of objects){
    title = object.title
    date = ""
    if(app == "reminder"){
      date = df.string(object.creationDate)
    }else{
      date = object.startDate
    }
   
    color = object.calendar.color.hex
    objects_processed.push(new Object(title, date, color))
   
  }
  return objects_processed
}



// ############ WIDGET CREATION ################

async function createWidget(){
  
  // Loading all data
  reminders = await getObjectsFor('reminder')
  reminders = reminders.slice(0, R_COUNT)
  events = await getObjectsFor('calendar')
  events = events.slice(0, E_COUNT)
  weather_data = await getWeather()
  quote = await getQuote()
    
  if(SHOW_TELEKOM){
    telekom_data = await telekom.getData()
  }
  
  
// ######## Layout ########
  
  widget = new ListWidget()

  header_stack = widget.addStack()
  widget.addSpacer()
  list_stack = widget.addStack()
  
  left_h_stack = header_stack.addStack()
  header_stack.addSpacer()
  right_h_stack = header_stack.addStack()
  
  title_date_stack = left_h_stack.addStack()
  left_h_stack.addSpacer(space)
  quote_stack = left_h_stack.addStack()
  left_h_stack.addSpacer()
  
  weather_stack = right_h_stack.addStack() 
  right_h_stack.addSpacer(space)
  device_stack = right_h_stack.addStack()
  right_h_stack.addSpacer()
  
  weather_row_temp = weather_stack.addStack()
  weather_stack.addSpacer(space)
  weather_row_sun = weather_stack.addStack()
  
  device_box = device_stack.addStack()
  device_bat_stack = device_box.addStack()
  
  
  r_stack = list_stack.addStack()
  list_stack.addSpacer()
  e_stack = list_stack.addStack()
  
  
  
  // Stack layouts
  left_h_stack.layoutVertically()
  right_h_stack.layoutVertically()
  
  title_date_stack.layoutVertically()
  
  weather_stack.layoutVertically()
  device_stack.layoutVertically()
  
  weather_row_temp.layoutHorizontally()
  weather_row_sun.layoutHorizontally()
  
  device_box.layoutVertically()
  device_bat_stack.layoutHorizontally()
  
  r_stack.layoutVertically()
  e_stack.layoutVertically()
  
  
  

//######## TEXT ##########

  // Title and date
  if(SHOW_GREETING){
    title = title_date_stack.addText(getGreeting() + ",")
    user = title_date_stack.addText(USER + "!")
    title_date_stack.addSpacer(5)
    date = title_date_stack.addText(getProcessedDate())
    
    title.font = title_font
    user.font = title_font
    date.font = list_font
  }
  
  // Quote
  if(SHOW_QUOTE){
    quote_txt = quote_stack.addText('"' + quote + '"')
    
    quote_txt.font = list_font
  }
  
  // Weather
  weather_txt_temp = weather_row_temp.addText(getWeatherCond(weather_data.weather[0].main) + " " + String(weather_data.main.temp) + " °C")
  weather_row_temp.addSpacer()
  weather_txt_wind = weather_row_temp.addText("💨 " + String(weather_data.wind.speed))
  
  weather_txt_sunrise = weather_row_sun.addText("🌅 " + getTimeForSun("rise", weather_data))
  weather_row_sun.addSpacer()
  weather_txt_sunset = weather_row_sun.addText("🌄 " + getTimeForSun("set", weather_data))
  
  // Battery, Data usage, Screen brightness  
  battery_sym = device_bat_stack.addText(((Device.isCharging()) ? "⚡️" : "🔋 "))
  battery_txt = device_bat_stack.addText(String(Math.round(round(Device.batteryLevel())*100)) + "%")
  battery_i_txt = device_bat_stack.addText(" noch übrig")
  
  device_box.addSpacer(space)
  if(SHOW_TELEKOM){
    telekom_txt = device_box.addText("📶 " + telekom_data.remainingVolume + " von " + telekom_data.initialVolume)
    device_box.addSpacer(space)
    telekom_txt.font = list_font
  }
  screen_txt = device_box.addText("💡 " + String(Math.round(round(Device.screenBrightness()*100))) + "% Helligkeit")
  
  
  
  // Reminders and Calendar Events
  for(reminder of reminders){
    reminder_stack = r_stack.addStack()
    reminder_rect = reminder_stack.addText("\u2759 ")
    reminder_rect.textColor = new Color("#"+reminder.color)
    reminder_txt = reminder_stack.addText(reminder.title)
    reminder_rect.font = list_font
    reminder_txt.font = list_font 
  }
  for(event of events){
    event_stack = e_stack.addStack()
    event_rect = event_stack.addText("\u2759 ")
    event_rect.textColor = new Color("#"+event.color)
    event_txt = event_stack.addText(event.title)  
    event_rect.font = list_font
    event_txt.font = list_font
  }
  
  
  
 // ######## FORMATTING #########
  
  weather_txt_wind.font = list_font
  weather_txt_temp.font = list_font
  weather_txt_sunrise.font = list_font
  weather_txt_sunset.font = list_font

  battery_txt.font = list_font
  battery_sym.font = list_font
  battery_i_txt.font = list_font
  screen_txt.font = list_font
  

  
  
  // Box 
  
  if(GREET_BOX){
    title_date_stack.backgroundColor = box_color
    title_date_stack.cornerRadius = box_corner_radius
    title_date_stack.size = box_size
  }
  title_date_stack.setPadding(5, 5, 5, 5)
  
  if(QUOTE_BOX){
    quote_stack.backgroundColor = box_color
    quote_stack.cornerRadius = box_corner_radius
    quote_stack.size = box_size  
  }
  quote_stack.setPadding(5, 5, 5, 5)
  
  if(WEATHER_BOX){
    weather_stack.backgroundColor = box_color
    weather_stack.cornerRadius = box_corner_radius
    weather_stack.size = box_size
  }
  weather_stack.setPadding(5, 5, 5, 5)  
  
  if(DEVICE_BOX){
    device_box.backgroundColor = box_color
    device_box.cornerRadius = box_corner_radius
    device_box.size = box_size
  }
  device_box.setPadding(5, 5, 5, 5)
  
  if(R_BOX){
    r_stack.backgroundColor = box_color
    r_stack.cornerRadius = box_corner_radius
    r_stack.size = box_size
  }
  r_stack.setPadding(5, 5, 5, 5)
  
  if(E_BOX){
    e_stack.backgroundColor = box_color
    e_stack.cornerRadius = box_corner_radius
    e_stack.size = box_size
  }
  e_stack.setPadding(5, 5, 5, 5)
  
  
  
  // URL
  r_stack.url = "x-apple-reminderkit://"
  e_stack.url = "calshow://"
  quote_stack.url = "https://www.brainyquote.com/quote_of_the_day"  
  
  // Background
  if(CUSTOM_IMAGE){
    image = await fm.readImage(fm.joinPath(path, IMAGE_NAME))
    widget.backgroundImage = image
  }else{
    gradient = new LinearGradient()
    gradient.colors = [GRADIENT_C_1, GRADIENT_C_2]
    gradient.locations = GRADIENT_L
    widget.backgroundGradient = gradient
  }
  
  widget.setPadding(padding, padding, padding, padding)
  
  return widget
}

w = await createWidget()
if(showPreview){
  w.presentLarge()
}
Script.setWidget(w)
Script.complete()
