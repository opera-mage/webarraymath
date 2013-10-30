// FPS counter class.
var FPSCounter = function () {
  var m_num_frames = 0;
  var m_total_frames_time = 0;
  var m_frame_start_time;
  var m_fps = -1;

  this.update = function () {
    var t = (new Date()).getTime();
    if (m_frame_start_time > 0) {
      var dt = (t - m_frame_start_time) * 0.001;
      m_total_frames_time += dt;
      m_num_frames++;
      if (m_total_frames_time >= 1.0 && m_num_frames >= 2) {
        m_fps = m_num_frames / m_total_frames_time;
        m_total_frames_time = 0;
        m_num_frames = 0;
      }
    }
    m_frame_start_time = t;
  };

  this.get = function () {
    return m_fps;
  };
};

