# Windows 12-inspired Desktop Setup Wizard
import base64,ctypes,json,os,queue,shutil,subprocess,sys,tempfile,threading,time,winreg
from pathlib import Path
PAYLOAD="ZnJvbSBfX2Z1dHVyZV9fIGltcG9ydCBhbm5vdGF0aW9ucwppbXBvcnQgYXJncGFyc2UsanNvbixtYXRoLG9zLHN1YnByb2Nlc3Msc3lzLHRpbWUsdHJhY2ViYWNrLHVybGxpYi5wYXJzZSx1cmxsaWIucmVxdWVzdApmcm9tIHBhdGhsaWIgaW1wb3J0IFBhdGgKZnJvbSBQeVF0Ni5RdENvcmUgaW1wb3J0IFF0LFFUaW1lcixRUmVjdEYKZnJvbSBQeVF0Ni5RdEd1aSBpbXBvcnQgUUNvbG9yLFFQYWludGVyLFFMaW5lYXJHcmFkaWVudCxRUGVuLFFGb250CmZyb20gUHlRdDYuUXRXaWRnZXRzIGltcG9ydCBRQXBwbGljYXRpb24sUUZyYW1lLFFMYWJlbCxRUHVzaEJ1dHRvbixRSEJveExheW91dCxRVkJveExheW91dCxRTGluZUVkaXQsUUZpbGVEaWFsb2csUU1lbnUsUU1lc3NhZ2VCb3gsUVdpZGdldApST09UPShQYXRoKHN5cy5leGVjdXRhYmxlKS5yZXNvbHZlKCkucGFyZW50IGlmIGdldGF0dHIoc3lzLCJmcm96ZW4iLEZhbHNlKSBlbHNlIFBhdGgoX19maWxlX18pLnJlc29sdmUoKS5wYXJlbnQpCkNGRz1ST09ULyJjb25maWcuanNvbiIKX2Jvb3RfY2ZnPWpzb24ubG9hZHMoQ0ZHLnJlYWRfdGV4dChlbmNvZGluZz0idXRmLTgiKSkgaWYgQ0ZHLmV4aXN0cygpIGVsc2Uge30KREFUQT1QYXRoKG9zLnBhdGguZXhwYW5kdmFycyhfYm9vdF9jZmcuZ2V0KCJkYXRhX3BhdGgiLHN0cihQYXRoKG9zLmVudmlyb24uZ2V0KCJMT0NBTEFQUERBVEEiLHN0cihQYXRoLmhvbWUoKS8iQXBwRGF0YSIvIkxvY2FsIikpKS8iV2luZG93czEyIikpKSk7REFUQS5ta2RpcihwYXJlbnRzPVRydWUsZXhpc3Rfb2s9VHJ1ZSkKV0lER0VUUz1EQVRBLyJ3aWRnZXRzLmpzb24iO1BPUz1EQVRBLyJUYXNrYmFyUG9zLmpzb24iCmRlZiByZWFkKHAsZCk6CiB0cnk6cmV0dXJuIGpzb24ubG9hZHMocC5yZWFkX3RleHQoZW5jb2Rpbmc9InV0Zi04IikpCiBleGNlcHQ6cmV0dXJuIGQKZGVmIHdyaXRlKHAsdik6CiBwLnBhcmVudC5ta2RpcihwYXJlbnRzPVRydWUsZXhpc3Rfb2s9VHJ1ZSk7dG1wPXAud2l0aF9zdWZmaXgocC5zdWZmaXgrIi50bXAiKTt0bXAud3JpdGVfdGV4dChqc29uLmR1bXBzKHYsaW5kZW50PTIpLGVuY29kaW5nPSJ1dGYtOCIpO29zLnJlcGxhY2UodG1wLHApCmRlZiBsYXVuY2goeCk6CiB0cnk6b3Muc3RhcnRmaWxlKHgpCiBleGNlcHQgRXhjZXB0aW9uIGFzIGU6UU1lc3NhZ2VCb3gud2FybmluZyhOb25lLCJMYXVuY2ggZmFpbGVkIixzdHIoZSkpCmRlZiBsb2dfZXJyb3IodHAsdmFsLHRiKToKIHRleHQ9IiIuam9pbih0cmFjZWJhY2suZm9ybWF0X2V4Y2VwdGlvbih0cCx2YWwsdGIpKTsoREFUQS8iY3Jhc2gubG9nIikud3JpdGVfdGV4dCh0ZXh0LGVuY29kaW5nPSJ1dGYtOCIpO1FNZXNzYWdlQm94LmNyaXRpY2FsKE5vbmUsIldpbmRvd3MgMTIgVGhlbWUiLHN0cih2YWwpKyJcblxuTG9nZ2VkIHRvICIrc3RyKERBVEEvImNyYXNoLmxvZyIpKQpjbGFzcyBHbGFzcyhRRnJhbWUpOgogZGVmIF9faW5pdF9fKHNlbGYsYyxyPTIyKTpzdXBlcigpLl9faW5pdF9fKCk7c2VsZi5jPWM7c2VsZi5yPXI7c2VsZi5zZXRBdHRyaWJ1dGUoUXQuV2lkZ2V0QXR0cmlidXRlLldBX1RyYW5zbHVjZW50QmFja2dyb3VuZCkKIGRlZiBwYWludEV2ZW50KHNlbGYsZSk6CiAgcD1RUGFpbnRlcihzZWxmKTtwLnNldFJlbmRlckhpbnQoUVBhaW50ZXIuUmVuZGVySGludC5BbnRpYWxpYXNpbmcpO2E9c2VsZi5jLmdldCgiZ3JhZGllbnQiLCIjNGMxZDk1LCNhODU1ZjciKS5zcGxpdCgiLCIpO2c9UUxpbmVhckdyYWRpZW50KDAsMCxzZWxmLndpZHRoKCksc2VsZi5oZWlnaHQoKSk7Zy5zZXRDb2xvckF0KDAsUUNvbG9yKGFbMF0pKTtnLnNldENvbG9yQXQoMSxRQ29sb3IoYVstMV0pKTtwLnNldEJydXNoKGcpO3Auc2V0UGVuKFFDb2xvcigyNTUsMjU1LDI1NSw0OCkpO3AuZHJhd1JvdW5kZWRSZWN0KHNlbGYucmVjdCgpLmFkanVzdGVkKDEsMSwtMSwtMSksc2VsZi5yLHNlbGYucikKY2xhc3MgU3BsYXNoKFFXaWRnZXQpOgogZGVmIF9faW5pdF9fKHNlbGYsYyxkb25lKToKICBzdXBlcigpLl9faW5pdF9fKCk7c2VsZi5jPWM7c2VsZi5kb25lPWRvbmU7c2VsZi5waGFzZT0wO3NlbGYucHJvZ3Jlc3M9MDtzZWxmLm1lc3NhZ2VzPVsiV2FraW5nIHVwIHlvdXIgd29ya3NwYWNlIiwiUmVzdG9yaW5nIHdpZGdldHMiLCJTaGFwaW5nIHRoZSBjb21tYW5kIHBpbGwiLCJQb2xpc2hpbmcgdGhlIGRlc2t0b3AiXQogIHNlbGYuc2V0V2luZG93RmxhZ3MoUXQuV2luZG93VHlwZS5GcmFtZWxlc3NXaW5kb3dIaW50fFF0LldpbmRvd1R5cGUuV2luZG93U3RheXNPblRvcEhpbnQpO3NlbGYuc2hvd0Z1bGxTY3JlZW4oKTtzZWxmLnRpbWVyPVFUaW1lcihzZWxmKTtzZWxmLnRpbWVyLnRpbWVvdXQuY29ubmVjdChzZWxmLnN0ZXApO3NlbGYudGltZXIuc3RhcnQoMTYpCiBkZWYgc3RlcChzZWxmKToKICBzZWxmLnBoYXNlKz0uMDU1O3NlbGYucHJvZ3Jlc3M9bWluKDEwMCxzZWxmLnByb2dyZXNzKy41NSk7c2VsZi51cGRhdGUoKQogIGlmIHNlbGYucHJvZ3Jlc3M+PTEwMDpzZWxmLnRpbWVyLnN0b3AoKTtRVGltZXIuc2luZ2xlU2hvdCgxNjAsc2VsZi5maW5pc2gpCiBkZWYgZmluaXNoKHNlbGYpOnNlbGYuY2xvc2UoKTtzZWxmLmRvbmUoKQogZGVmIHBhaW50RXZlbnQoc2VsZixlKToKICBwPVFQYWludGVyKHNlbGYpO3Auc2V0UmVuZGVySGludChRUGFpbnRlci5SZW5kZXJIaW50LkFudGlhbGlhc2luZyk7Zz1RTGluZWFyR3JhZGllbnQoMCwwLHNlbGYud2lkdGgoKSxzZWxmLmhlaWdodCgpKTtnLnNldENvbG9yQXQoMCxRQ29sb3IoIiMxMjA4MjciKSk7Zy5zZXRDb2xvckF0KC41MixRQ29sb3IoIiMzYjE2NzgiKSk7Zy5zZXRDb2xvckF0KDEsUUNvbG9yKCIjOGI1Y2Y2IikpO3AuZmlsbFJlY3Qoc2VsZi5yZWN0KCksZyk7Y3g9c2VsZi53aWR0aCgpLzI7Y3k9c2VsZi5oZWlnaHQoKS8yCiAgZm9yIGkgaW4gcmFuZ2UoNCk6CiAgIHB1bHNlPShtYXRoLnNpbihzZWxmLnBoYXNlLWkqLjcpKzEpLzI7cj03MitpKjM1K3B1bHNlKjE4O2NvbG9yPVFDb2xvcigxOTAsMTQwLDI1NSxtYXgoMTUsNzUtaSoxMykpO3Auc2V0UGVuKFFQZW4oY29sb3IsMykpO3Auc2V0QnJ1c2goUXQuQnJ1c2hTdHlsZS5Ob0JydXNoKTtwLmRyYXdFbGxpcHNlKFFSZWN0RihjeC1yLGN5LXIscioyLHIqMikpCiAgcC5zZXRQZW4oUUNvbG9yKCJ3aGl0ZSIpKTtwLnNldEZvbnQoUUZvbnQoIlNlZ29lIFVJIFZhcmlhYmxlIERpc3BsYXkiLDM0LFFGb250LldlaWdodC5EZW1pQm9sZCkpO3AuZHJhd1RleHQoUVJlY3RGKDAsY3ktMzQsc2VsZi53aWR0aCgpLDcwKSxRdC5BbGlnbm1lbnRGbGFnLkFsaWduQ2VudGVyLCJXaW5kb3dzIDEyIikKICBwLnNldEZvbnQoUUZvbnQoIlNlZ29lIFVJIiwxMikpO3Auc2V0UGVuKFFDb2xvcigyMzYsMjI2LDI1NSkpO21zZz1zZWxmLm1lc3NhZ2VzW21pbihsZW4oc2VsZi5tZXNzYWdlcyktMSxpbnQoc2VsZi5wcm9ncmVzcy8vMjYpKV07cC5kcmF3VGV4dChRUmVjdEYoMCxjeSs2MixzZWxmLndpZHRoKCksNDApLFF0LkFsaWdubWVudEZsYWcuQWxpZ25DZW50ZXIsbXNnKQogIHc9bWluKDUyMCxzZWxmLndpZHRoKCkqLjQyKTt4PWN4LXcvMjt5PWN5KzEyMDtwLnNldFBlbihRdC5QZW5TdHlsZS5Ob1Blbik7cC5zZXRCcnVzaChRQ29sb3IoMjU1LDI1NSwyNTUsMzUpKTtwLmRyYXdSb3VuZGVkUmVjdChRUmVjdEYoeCx5LHcsOCksNCw0KTtwLnNldEJydXNoKFFDb2xvcigiI2Q4YjRmZSIpKTtwLmRyYXdSb3VuZGVkUmVjdChRUmVjdEYoeCx5LHcqc2VsZi5wcm9ncmVzcy8xMDAsOCksNCw0KQpjbGFzcyBDYXJkKEdsYXNzKToKIGRlZiBfX2luaXRfXyhzZWxmLHMsbSk6CiAgc3VwZXIoKS5fX2luaXRfXyhtLmMpO3NlbGYucz1zO3NlbGYubT1tO3NlbGYuZHJhZz1Ob25lO3NlbGYuc2V0V2luZG93RmxhZ3MoUXQuV2luZG93VHlwZS5GcmFtZWxlc3NXaW5kb3dIaW50fFF0LldpbmRvd1R5cGUuVG9vbCk7c2VsZi5zZXRHZW9tZXRyeShpbnQoc1sieCJdKSxpbnQoc1sieSJdKSxpbnQoc1sidyJdKSxpbnQoc1siaCJdKSkKICB2PVFWQm94TGF5b3V0KHNlbGYpO2g9UUhCb3hMYXlvdXQoKTt0PVFMYWJlbChzdHIoc1sidGl0bGUiXSkpO3Quc2V0U3R5bGVTaGVldCgiY29sb3I6d2hpdGU7Zm9udC1zaXplOjE2cHg7Zm9udC13ZWlnaHQ6NzAwIik7bW49UVB1c2hCdXR0b24oIl8iKTtjbD1RUHVzaEJ1dHRvbigiWCIpO2guYWRkV2lkZ2V0KHQpO2guYWRkU3RyZXRjaCgpO2guYWRkV2lkZ2V0KG1uKTtoLmFkZFdpZGdldChjbCk7di5hZGRMYXlvdXQoaCk7c2VsZi5ib2R5PVFMYWJlbCgpO3NlbGYuYm9keS5zZXRBbGlnbm1lbnQoUXQuQWxpZ25tZW50RmxhZy5BbGlnbkNlbnRlcik7c2VsZi5ib2R5LnNldFdvcmRXcmFwKFRydWUpO3NlbGYuYm9keS5zZXRTdHlsZVNoZWV0KCJjb2xvcjp3aGl0ZTtmb250LXNpemU6MjFweCIpO3YuYWRkV2lkZ2V0KHNlbGYuYm9keSwxKTttbi5jbGlja2VkLmNvbm5lY3Qoc2VsZi5taW5pKTtjbC5jbGlja2VkLmNvbm5lY3Qoc2VsZi5yZW1vdmUpO3NlbGYudGljaygpO3NlbGYudG09UVRpbWVyKHNlbGYpO3NlbGYudG0udGltZW91dC5jb25uZWN0KHNlbGYudGljayk7c2VsZi50bS5zdGFydCgxMDAwIGlmIHNbInR5cGUiXT09ImNsb2NrIiBlbHNlIDYwMDAwKQogZGVmIHRpY2soc2VsZik6CiAgaWYgc2VsZi5zWyJ0eXBlIl09PSJjbG9jayI6c2VsZi5ib2R5LnNldFRleHQodGltZS5zdHJmdGltZSgiJUk6JU0gJXBcbiVBLCAlQiAlZCIpKQogIGVsaWYgc2VsZi5zWyJ0eXBlIl09PSJ3ZWF0aGVyIjoKICAgdHJ5OgogICAgcT11cmxsaWIucGFyc2UudXJsZW5jb2RlKHsibGF0aXR1ZGUiOnNlbGYubS5jWyJ3ZWF0aGVyX2xhdCJdLCJsb25naXR1ZGUiOnNlbGYubS5jWyJ3ZWF0aGVyX2xvbiJdLCJjdXJyZW50IjoidGVtcGVyYXR1cmVfMm0scmVsYXRpdmVfaHVtaWRpdHlfMm0sd2luZF9zcGVlZF8xMG0iLCJ0ZW1wZXJhdHVyZV91bml0IjoiZmFocmVuaGVpdCIsIndpbmRfc3BlZWRfdW5pdCI6Im1waCJ9KTtkPWpzb24ubG9hZCh1cmxsaWIucmVxdWVzdC51cmxvcGVuKCJodHRwczovL2FwaS5vcGVuLW1ldGVvLmNvbS92MS9mb3JlY2FzdD8iK3EsdGltZW91dD03KSlbImN1cnJlbnQiXTtzZWxmLmJvZHkuc2V0VGV4dChmJ3tkWyJ0ZW1wZXJhdHVyZV8ybSJdfSBGICB8ICBIdW1pZGl0eSB7ZFsicmVsYXRpdmVfaHVtaWRpdHlfMm0iXX0lXG5XaW5kIHtkWyJ3aW5kX3NwZWVkXzEwbSJdfSBtcGgnKQogICBleGNlcHQ6c2VsZi5ib2R5LnNldFRleHQoIldlYXRoZXIgdW5hdmFpbGFibGUiKQogIGVsc2U6c2VsZi5ib2R5LnNldFRleHQoc3RyKHNlbGYucy5nZXQoImN1c3RvbV9kYXRhIix7fSkuZ2V0KCJ0ZXh0IiwiQ3VzdG9tIHdpZGdldCIpKSkKIGRlZiBtb3VzZVByZXNzRXZlbnQoc2VsZixlKToKICBpZiBlLmJ1dHRvbigpPT1RdC5Nb3VzZUJ1dHRvbi5MZWZ0QnV0dG9uIGFuZCBlLnBvc2l0aW9uKCkueSgpPDUwOnNlbGYuZHJhZz1lLmdsb2JhbFBvc2l0aW9uKCkudG9Qb2ludCgpLXNlbGYucG9zKCkKIGRlZiBtb3VzZU1vdmVFdmVudChzZWxmLGUpOgogIGlmIHNlbGYuZHJhZyBpcyBub3QgTm9uZTpzZWxmLm1vdmUoZS5nbG9iYWxQb3NpdGlvbigpLnRvUG9pbnQoKS1zZWxmLmRyYWcpCiBkZWYgbW91c2VSZWxlYXNlRXZlbnQoc2VsZixlKTpzZWxmLmRyYWc9Tm9uZTtzZWxmLm0uc2F2ZSgpCiBkZWYgbWluaShzZWxmLGNoZWNrZWQ9RmFsc2UpOnNlbGYuYm9keS5zZXRWaXNpYmxlKHNlbGYuYm9keS5pc0hpZGRlbigpKTtzZWxmLnJlc2l6ZShzZWxmLndpZHRoKCksc2VsZi5zWyJoIl0gaWYgc2VsZi5ib2R5LmlzVmlzaWJsZSgpIGVsc2UgNTIpO3NlbGYubS5zYXZlKCkKIGRlZiByZW1vdmUoc2VsZixjaGVja2VkPUZhbHNlKTpzZWxmLm0uY2FyZHMucmVtb3ZlKHNlbGYpO3NlbGYubS5zdGF0ZXMucmVtb3ZlKHNlbGYucyk7c2VsZi5jbG9zZSgpO3NlbGYubS5zYXZlKCkKY2xhc3MgUGlsbChHbGFzcyk6CiBkZWYgX19pbml0X18oc2VsZixtKToKICBzdXBlcigpLl9faW5pdF9fKG0uYywyOCk7c2VsZi5tPW07c2VsZi5kcmFnPU5vbmU7c2VsZi5zZXRXaW5kb3dGbGFncyhRdC5XaW5kb3dUeXBlLkZyYW1lbGVzc1dpbmRvd0hpbnR8UXQuV2luZG93VHlwZS5Ub29sfFF0LldpbmRvd1R5cGUuV2luZG93U3RheXNPblRvcEhpbnQpO2c9UUFwcGxpY2F0aW9uLnByaW1hcnlTY3JlZW4oKS5hdmFpbGFibGVHZW9tZXRyeSgpO3E9cmVhZChQT1MseyJ4IjooZy53aWR0aCgpLTc2MCkvLzIsInkiOmcuaGVpZ2h0KCktODJ9KTtzZWxmLnNldEdlb21ldHJ5KGludChxWyJ4Il0pLGludChxWyJ5Il0pLDc2MCw2NCk7aD1RSEJveExheW91dChzZWxmKQogIGZvciBuLGYgaW4gWygiU3RhcnQiLGxhbWJkYTpsYXVuY2goInNoZWxsOkFwcHNGb2xkZXIiKSksKCJTZWFyY2giLGxhbWJkYTpzdWJwcm9jZXNzLlBvcGVuKFsiZXhwbG9yZXIuZXhlIiwic2VhcmNoLW1zOiJdKSksKCJGaWxlcyIsbGFtYmRhOmxhdW5jaCgiZXhwbG9yZXIuZXhlIikpLCgiU2V0dGluZ3MiLGxhbWJkYTpsYXVuY2goIm1zLXNldHRpbmdzOiIpKSwoIkNsb2NrIixsYW1iZGE6bGF1bmNoKCJtcy1jbG9jazoiKSksKCJXaWRnZXRzIixtLnBhbmVsKV06Yj1RUHVzaEJ1dHRvbihuKTtiLmNsaWNrZWQuY29ubmVjdChmKTtoLmFkZFdpZGdldChiKQogIHVwPVFQdXNoQnV0dG9uKCJeIik7bWVudT1RTWVudSh1cCk7bWVudS5hZGRBY3Rpb24oIkxhdW5jaCBhbiBhcHAuLi4iLHNlbGYucGljayk7bWVudS5hZGRBY3Rpb24oIldpZGdldCBTdHVkaW8iLG0ucGFuZWwpO21lbnUuYWRkQWN0aW9uKCJRdWl0IixRQXBwbGljYXRpb24ucXVpdCk7dXAuc2V0TWVudShtZW51KTtoLmFkZFdpZGdldCh1cCk7aC5hZGRTdHJldGNoKCk7c2VsZi50PVFMYWJlbCgpO3NlbGYudC5zZXRTdHlsZVNoZWV0KCJjb2xvcjp3aGl0ZTtmb250LXdlaWdodDo3MDAiKTtoLmFkZFdpZGdldChzZWxmLnQpO3NlbGYudG09UVRpbWVyKHNlbGYpO3NlbGYudG0udGltZW91dC5jb25uZWN0KGxhbWJkYTpzZWxmLnQuc2V0VGV4dCh0aW1lLnN0cmZ0aW1lKCIlSTolTSAlcFxuJW0vJWQvJVkiKSkpO3NlbGYudG0uc3RhcnQoMTAwMCk7c2VsZi50bS50aW1lb3V0LmVtaXQoKQogZGVmIHBpY2soc2VsZik6CiAgeCxfPVFGaWxlRGlhbG9nLmdldE9wZW5GaWxlTmFtZShzZWxmLCJMYXVuY2ggYXBwIiwiQzpcXCIsIlByb2dyYW1zICgqLmV4ZSk7O0FsbCBmaWxlcyAoKikiKQogIGlmIHg6bGF1bmNoKHgpCiBkZWYgbW91c2VQcmVzc0V2ZW50KHNlbGYsZSk6CiAgaWYgZS5idXR0b24oKT09UXQuTW91c2VCdXR0b24uTGVmdEJ1dHRvbjpzZWxmLmRyYWc9ZS5nbG9iYWxQb3NpdGlvbigpLnRvUG9pbnQoKS1zZWxmLnBvcygpCiBkZWYgbW91c2VNb3ZlRXZlbnQoc2VsZixlKToKICBpZiBzZWxmLmRyYWcgaXMgbm90IE5vbmU6c2VsZi5tb3ZlKGUuZ2xvYmFsUG9zaXRpb24oKS50b1BvaW50KCktc2VsZi5kcmFnKQogZGVmIG1vdXNlUmVsZWFzZUV2ZW50KHNlbGYsZSk6c2VsZi5kcmFnPU5vbmU7d3JpdGUoUE9TLHsieCI6c2VsZi54KCksInkiOnNlbGYueSgpfSkKY2xhc3MgU3R1ZGlvKEdsYXNzKToKIGRlZiBfX2luaXRfXyhzZWxmLG0pOgogIHN1cGVyKCkuX19pbml0X18obS5jKTtzZWxmLm09bTtzZWxmLnNldFdpbmRvd0ZsYWdzKFF0LldpbmRvd1R5cGUuRnJhbWVsZXNzV2luZG93SGludHxRdC5XaW5kb3dUeXBlLlRvb2x8UXQuV2luZG93VHlwZS5XaW5kb3dTdGF5c09uVG9wSGludCk7c2VsZi5zZXRHZW9tZXRyeSg5MCw4MCw0NDAsNTgwKTt2PVFWQm94TGF5b3V0KHNlbGYpO2g9UUhCb3hMYXlvdXQoKTt0aXRsZT1RTGFiZWwoIldpZGdldCBTdHVkaW8iKTt0aXRsZS5zZXRTdHlsZVNoZWV0KCJjb2xvcjp3aGl0ZTtmb250LXNpemU6MjVweDtmb250LXdlaWdodDo4MDAiKTtoLmFkZFdpZGdldCh0aXRsZSk7aC5hZGRTdHJldGNoKCk7eD1RUHVzaEJ1dHRvbigiWCIpO3guY2xpY2tlZC5jb25uZWN0KHNlbGYuY2xvc2UpO2guYWRkV2lkZ2V0KHgpO3YuYWRkTGF5b3V0KGgpO2hpbnQ9UUxhYmVsKCJDaG9vc2UgYSB3aWRnZXQgb3IgZGVzaWduIHlvdXIgb3duLiBFdmVyeSBjaGFuZ2UgaXMgc2F2ZWQgYXV0b21hdGljYWxseS4iKTtoaW50LnNldFdvcmRXcmFwKFRydWUpO2hpbnQuc2V0U3R5bGVTaGVldCgiY29sb3I6d2hpdGUiKTt2LmFkZFdpZGdldChoaW50KQogIGZvciBuYW1lLHR5cCBpbiBbKCJDbG9jayIsImNsb2NrIiksKCJXZWF0aGVyIiwid2VhdGhlciIpLCgiUXVpY2sgbm90ZSIsIm5vdGUiKSwoIkZvY3VzIGNhcmQiLCJjdXN0b20iKSwoIkRhaWx5IGdvYWwiLCJjdXN0b20iKV06Yj1RUHVzaEJ1dHRvbihuYW1lKTtiLnNldE1pbmltdW1IZWlnaHQoNTQpO2IuY2xpY2tlZC5jb25uZWN0KGxhbWJkYSBjaGVja2VkPUZhbHNlLHQ9dHlwLG49bmFtZTpzZWxmLmNyZWF0ZSh0LG4sbikpO3YuYWRkV2lkZ2V0KGIpCiAgc2VsZi50aXRsZT1RTGluZUVkaXQoKTtzZWxmLnRpdGxlLnNldFBsYWNlaG9sZGVyVGV4dCgiQ3VzdG9tIHRpdGxlIik7c2VsZi50ZXh0PVFMaW5lRWRpdCgpO3NlbGYudGV4dC5zZXRQbGFjZWhvbGRlclRleHQoIkN1c3RvbSB0ZXh0Iik7di5hZGRXaWRnZXQoc2VsZi50aXRsZSk7di5hZGRXaWRnZXQoc2VsZi50ZXh0KTtiPVFQdXNoQnV0dG9uKCJDcmVhdGUgY3VzdG9tIHdpZGdldCIpO2IuY2xpY2tlZC5jb25uZWN0KGxhbWJkYSBjaGVja2VkPUZhbHNlOnNlbGYuY3JlYXRlKCJjdXN0b20iLHNlbGYudGl0bGUudGV4dCgpIG9yICJDdXN0b20iLHNlbGYudGV4dC50ZXh0KCkpKTt2LmFkZFdpZGdldChiKQogZGVmIGNyZWF0ZShzZWxmLHQsdGl0bGUsdGV4dCk6CiAgdHJ5OnNlbGYubS5hZGQoc3RyKHQpLHN0cih0aXRsZSksc3RyKHRleHQpKQogIGV4Y2VwdCBFeGNlcHRpb246bG9nX2Vycm9yKCpzeXMuZXhjX2luZm8oKSkKY2xhc3MgUXVpY2tDcmVhdGUoR2xhc3MpOgogZGVmIF9faW5pdF9fKHNlbGYsbSk6CiAgc3VwZXIoKS5fX2luaXRfXyhtLmMpO3NlbGYubT1tO3NlbGYuc2V0V2luZG93VGl0bGUoIkNyZWF0ZSBhIFdpbmRvd3MgMTIgd2lkZ2V0Iik7c2VsZi5zZXRXaW5kb3dGbGFncyhRdC5XaW5kb3dUeXBlLkZyYW1lbGVzc1dpbmRvd0hpbnR8UXQuV2luZG93VHlwZS5Ub29sfFF0LldpbmRvd1R5cGUuV2luZG93U3RheXNPblRvcEhpbnQpO3NlbGYuc2V0Rml4ZWRTaXplKDQzMCw0MTApCiAgc2NyZWVuPVFBcHBsaWNhdGlvbi5wcmltYXJ5U2NyZWVuKCkuYXZhaWxhYmxlR2VvbWV0cnkoKTtzZWxmLm1vdmUoc2NyZWVuLmNlbnRlcigpLXNlbGYucmVjdCgpLmNlbnRlcigpKTt2PVFWQm94TGF5b3V0KHNlbGYpO3Yuc2V0Q29udGVudHNNYXJnaW5zKDIyLDE4LDIyLDIwKQogIGg9UUhCb3hMYXlvdXQoKTt0aXRsZT1RTGFiZWwoIk5ldyB3aWRnZXQiKTt0aXRsZS5zZXRTdHlsZVNoZWV0KCJjb2xvcjp3aGl0ZTtmb250LXNpemU6MjVweDtmb250LXdlaWdodDo4MDAiKTtoLmFkZFdpZGdldCh0aXRsZSk7aC5hZGRTdHJldGNoKCk7eD1RUHVzaEJ1dHRvbigiWCIpO3guY2xpY2tlZC5jb25uZWN0KHNlbGYuY2xvc2UpO2guYWRkV2lkZ2V0KHgpO3YuYWRkTGF5b3V0KGgpCiAgaGludD1RTGFiZWwoIkNyZWF0ZSBvbmUgd2lkZ2V0IHF1aWNrbHkgd2l0aG91dCBvcGVuaW5nIHRoZSBmdWxsIFdpZGdldCBTdHVkaW8uIik7aGludC5zZXRXb3JkV3JhcChUcnVlKTtoaW50LnNldFN0eWxlU2hlZXQoImNvbG9yOndoaXRlIik7di5hZGRXaWRnZXQoaGludCkKICBzZWxmLmtpbmQ9UUxpbmVFZGl0KCk7c2VsZi5raW5kLnNldFBsYWNlaG9sZGVyVGV4dCgiVHlwZTogY2xvY2ssIHdlYXRoZXIsIG5vdGUsIG9yIGN1c3RvbSIpO3NlbGYua2luZC5zZXRUZXh0KCJub3RlIik7c2VsZi50aXRsZT1RTGluZUVkaXQoKTtzZWxmLnRpdGxlLnNldFBsYWNlaG9sZGVyVGV4dCgiV2lkZ2V0IHRpdGxlIik7c2VsZi50ZXh0PVFMaW5lRWRpdCgpO3NlbGYudGV4dC5zZXRQbGFjZWhvbGRlclRleHQoIldpZGdldCB0ZXh0Iik7di5hZGRXaWRnZXQoc2VsZi5raW5kKTt2LmFkZFdpZGdldChzZWxmLnRpdGxlKTt2LmFkZFdpZGdldChzZWxmLnRleHQpCiAgcHJlc2V0cz1RSEJveExheW91dCgpCiAgZm9yIG5hbWUsdHlwIGluIFsoIkNsb2NrIiwiY2xvY2siKSwoIldlYXRoZXIiLCJ3ZWF0aGVyIiksKCJOb3RlIiwibm90ZSIpXToKICAgYj1RUHVzaEJ1dHRvbihuYW1lKTtiLmNsaWNrZWQuY29ubmVjdChsYW1iZGEgY2hlY2tlZD1GYWxzZSx0PXR5cCxuPW5hbWU6c2VsZi5jaG9vc2UodCxuKSk7cHJlc2V0cy5hZGRXaWRnZXQoYikKICB2LmFkZExheW91dChwcmVzZXRzKTtjcmVhdGU9UVB1c2hCdXR0b24oIkNyZWF0ZSB3aWRnZXQiKTtjcmVhdGUuc2V0TWluaW11bUhlaWdodCg0OCk7Y3JlYXRlLmNsaWNrZWQuY29ubmVjdChzZWxmLm1ha2UpO3YuYWRkV2lkZ2V0KGNyZWF0ZSkKIGRlZiBjaG9vc2Uoc2VsZix0LG4pOnNlbGYua2luZC5zZXRUZXh0KHQpO3NlbGYudGl0bGUuc2V0VGV4dChuKQogZGVmIG1ha2Uoc2VsZixjaGVja2VkPUZhbHNlKToKICB0cnk6CiAgIHR5cD1zZWxmLmtpbmQudGV4dCgpLnN0cmlwKCkubG93ZXIoKSBvciAiY3VzdG9tIgogICBpZiB0eXAgbm90IGluICgiY2xvY2siLCJ3ZWF0aGVyIiwibm90ZSIsImN1c3RvbSIpOnR5cD0iY3VzdG9tIgogICBzZWxmLm0uYWRkKHR5cCxzZWxmLnRpdGxlLnRleHQoKS5zdHJpcCgpIG9yIHR5cC50aXRsZSgpLHNlbGYudGV4dC50ZXh0KCkpO3NlbGYuY2xvc2UoKQogIGV4Y2VwdCBFeGNlcHRpb246bG9nX2Vycm9yKCpzeXMuZXhjX2luZm8oKSkKCmNsYXNzIE1hbmFnZXI6CiBkZWYgX19pbml0X18oc2VsZik6CiAgc2VsZi5jPXJlYWQoQ0ZHLHsiZ3JhZGllbnQiOiIjNGMxZDk1LCNhODU1ZjciLCJ3ZWF0aGVyX2xhdCI6MjkuNDI0MSwid2VhdGhlcl9sb24iOi05OC40OTM2fSk7cmF3PXJlYWQoV0lER0VUUyxbXSk7c2VsZi5zdGF0ZXM9W10KICBmb3IgaSxzIGluIGVudW1lcmF0ZShyYXcgaWYgaXNpbnN0YW5jZShyYXcsbGlzdCkgZWxzZSBbXSk6CiAgIGlmIG5vdCBpc2luc3RhbmNlKHMsZGljdCk6Y29udGludWUKICAgZm9yIGssdiBpbiB7ImlkIjpzdHIodGltZS50aW1lX25zKCkraSksInR5cGUiOiJjdXN0b20iLCJ0aXRsZSI6IldpZGdldCIsIngiOjEwMCtpKjIwLCJ5IjoxMDAraSoyMCwidyI6MzEwLCJoIjoxODAsImN1c3RvbV9kYXRhIjp7fX0uaXRlbXMoKTpzLnNldGRlZmF1bHQoayx2KQogICBzZWxmLnN0YXRlcy5hcHBlbmQocykKICBzZWxmLmNhcmRzPVtdO3NlbGYuc3R1ZGlvPU5vbmU7c2VsZi5waWxsYmFyPU5vbmUKIGRlZiB3aWRnZXRzKHNlbGYpOgogIGZvciBzIGluIGxpc3Qoc2VsZi5zdGF0ZXMpOmM9Q2FyZChzLHNlbGYpO3NlbGYuY2FyZHMuYXBwZW5kKGMpO2Muc2hvdygpCiBkZWYgcGlsbChzZWxmKTpzZWxmLnBpbGxiYXI9UGlsbChzZWxmKTtzZWxmLnBpbGxiYXIuc2hvdygpCiBkZWYgcGFuZWwoc2VsZixjaGVja2VkPUZhbHNlKToKICBpZiBzZWxmLnN0dWRpbyBpcyBOb25lOnNlbGYuc3R1ZGlvPVN0dWRpbyhzZWxmKQogIHNlbGYuc3R1ZGlvLnNob3coKTtzZWxmLnN0dWRpby5yYWlzZV8oKTtzZWxmLnN0dWRpby5hY3RpdmF0ZVdpbmRvdygpCiBkZWYgYWRkKHNlbGYsdCx0aXRsZSx0ZXh0KToKICBuPWxlbihzZWxmLnN0YXRlcyk7cz17ImlkIjpzdHIodGltZS50aW1lX25zKCkpLCJ0eXBlIjp0LCJ0aXRsZSI6dGl0bGUsIngiOjgwKyhuJTYpKjM1LCJ5Ijo4MCsobiU2KSozMCwidyI6MzEwLCJoIjoxODAsIm1pbmltaXplZCI6RmFsc2UsImN1c3RvbV9kYXRhIjp7InRleHQiOnRleHR9fTtzZWxmLnN0YXRlcy5hcHBlbmQocyk7Yz1DYXJkKHMsc2VsZik7c2VsZi5jYXJkcy5hcHBlbmQoYyk7Yy5zaG93KCk7c2VsZi5zYXZlKCkKIGRlZiBzYXZlKHNlbGYpOgogIGZvciBjIGluIHNlbGYuY2FyZHM6Yy5zLnVwZGF0ZSh4PWMueCgpLHk9Yy55KCksdz1jLndpZHRoKCkpCiAgd3JpdGUoV0lER0VUUyxzZWxmLnN0YXRlcykKZGVmIG1haW4oKToKIHA9YXJncGFyc2UuQXJndW1lbnRQYXJzZXIoKTtwLmFkZF9hcmd1bWVudCgiLS1ib290IixhY3Rpb249InN0b3JlX3RydWUiKTtwLmFkZF9hcmd1bWVudCgiLS1pbml0V2lkZ2V0cyIsYWN0aW9uPSJzdG9yZV90cnVlIik7cC5hZGRfYXJndW1lbnQoIi0tQ3JlYXRlUGlsbCIsYWN0aW9uPSJzdG9yZV90cnVlIik7cC5hZGRfYXJndW1lbnQoIi0tQ3JlYXRlV2lkZ2V0UGFuZWwiLGFjdGlvbj0ic3RvcmVfdHJ1ZSIpO3AuYWRkX2FyZ3VtZW50KCItLU5ld1dpZGdldCIsYWN0aW9uPSJzdG9yZV90cnVlIik7cC5hZGRfYXJndW1lbnQoIi0tZmlsZXMiLGFjdGlvbj0ic3RvcmVfdHJ1ZSIpO3AuYWRkX2FyZ3VtZW50KCItLXNldHRpbmdzIixhY3Rpb249InN0b3JlX3RydWUiKTtwLmFkZF9hcmd1bWVudCgiLS1jbG9jayIsYWN0aW9uPSJzdG9yZV90cnVlIik7cC5hZGRfYXJndW1lbnQoIi0tbGF1bmNoVGFza2JhclBpbkFwcCIpO2E9cC5wYXJzZV9hcmdzKCkKIGlmIGEuZmlsZXM6bGF1bmNoKCJleHBsb3Jlci5leGUiKTtyZXR1cm4KIGlmIGEuc2V0dGluZ3M6bGF1bmNoKCJtcy1zZXR0aW5nczoiKTtyZXR1cm4KIGlmIGEuY2xvY2s6bGF1bmNoKCJtcy1jbG9jazoiKTtyZXR1cm4KIGlmIGEubGF1bmNoVGFza2JhclBpbkFwcDpsYXVuY2goYS5sYXVuY2hUYXNrYmFyUGluQXBwKTtyZXR1cm4KIGFwcD1RQXBwbGljYXRpb24oc3lzLmFyZ3YpO2FwcC5zZXRRdWl0T25MYXN0V2luZG93Q2xvc2VkKEZhbHNlKTtzeXMuZXhjZXB0aG9vaz1sb2dfZXJyb3I7bT1NYW5hZ2VyKCk7cmVmcz1bXQogZGVmIHJlYWR5KCk6CiAgaWYgYS5ib290IG9yIGEuaW5pdFdpZGdldHM6bS53aWRnZXRzKCkKICBpZiBhLmJvb3Qgb3IgYS5DcmVhdGVQaWxsOm0ucGlsbCgpCiAgaWYgYS5OZXdXaWRnZXQ6cT1RdWlja0NyZWF0ZShtKTtyZWZzLmFwcGVuZChxKTtxLnNob3coKQogIGVsaWYgYS5DcmVhdGVXaWRnZXRQYW5lbCBvciBub3QgYW55KChhLmJvb3QsYS5pbml0V2lkZ2V0cyxhLkNyZWF0ZVBpbGwsYS5OZXdXaWRnZXQpKTptLnBhbmVsKCkKIGlmIGEuYm9vdDpzPVNwbGFzaChtLmMscmVhZHkpO3JlZnMuYXBwZW5kKHMpCiBlbHNlOnJlYWR5KCkKIHN5cy5leGl0KGFwcC5leGVjKCkpCmlmIF9fbmFtZV9fPT0iX19tYWluX18iOm1haW4oKQo="
DEFAULT_INSTALL=Path(os.environ.get("PROGRAMDATA",r"C:\ProgramData"))/"Windows12"
DEFAULT_DATA=Path(os.environ.get("LOCALAPPDATA",str(Path.home()/"AppData"/"Local")))/"Windows12"
RUN_KEY=r"Software\Microsoft\Windows\CurrentVersion\Run"
CTX_KEY=r"Software\Classes\DesktopBackground\shell\Windows12Widgets"
NEW_WIDGET_KEYS=[
 r"Software\Classes\DesktopBackground\Shell\Windows12NewWidget",
 r"Software\Classes\Directory\Background\Shell\Windows12NewWidget",
 r"Software\Classes\Directory\Shell\Windows12NewWidget",
 r"Software\Classes\Folder\Shell\Windows12NewWidget",
 r"Software\Classes\*\Shell\Windows12NewWidget"
]
def elevated():
 try:return bool(ctypes.windll.shell32.IsUserAnAdmin())
 except:return False
def elevate():
 r=ctypes.windll.shell32.ShellExecuteW(None,"runas",sys.executable,subprocess.list2cmdline(sys.argv),None,1)
 if r<=32:raise SystemExit("Administrator approval was not granted")
 raise SystemExit
def delete_tree(hive,key):
 try:
  with winreg.OpenKey(hive,key,0,winreg.KEY_READ|winreg.KEY_WRITE) as k:
   children=[];i=0
   while True:
    try:children.append(winreg.EnumKey(k,i));i+=1
    except OSError:break
  for child in children:delete_tree(hive,key+"\\"+child)
  winreg.DeleteKey(hive,key)
 except OSError:pass
def remove_keys():
 try:
  with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE,RUN_KEY,0,winreg.KEY_SET_VALUE|winreg.KEY_WOW64_64KEY) as k:winreg.DeleteValue(k,"Windows12Theme")
 except OSError:pass
 for hive in (winreg.HKEY_CURRENT_USER,winreg.HKEY_LOCAL_MACHINE):
  for key in [CTX_KEY,*NEW_WIDGET_KEYS]:delete_tree(hive,key)
def uninstall_existing(root,log):
 log("Stopping the existing desktop process")
 subprocess.run(["taskkill","/F","/T","/IM","Windows12.exe"],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 cmd=root/"Uninstall.cmd"
 if cmd.exists():subprocess.run(["cmd","/c",str(cmd),"/silent"],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 remove_keys();time.sleep(.6)
 if root.exists():shutil.rmtree(root)
def install(opts,emit):
 root=Path(opts["install_path"]);data=Path(opts["data_path"]);stage=None
 def step(p,msg):emit(("progress",p,msg))
 step(3,"Preparing selected folders");root.mkdir(parents=True,exist_ok=True);data.mkdir(parents=True,exist_ok=True)
 step(8,"Creating the private Python environment");venv=root/".venv";subprocess.check_call([sys.executable,"-m","venv",str(venv)]);vpy=venv/"Scripts"/"python.exe"
 step(15,"Preparing package installer");subprocess.check_call([str(vpy),"-m","ensurepip","--upgrade"],stdout=subprocess.DEVNULL)
 step(22,"Downloading PyQt6 and build tools");subprocess.check_call([str(vpy),"-m","pip","install","--upgrade","pip"])
 step(34,"Downloading application dependencies");subprocess.check_call([str(vpy),"-m","pip","install","PyQt6","pyinstaller"])
 step(48,"Writing the Windows 12 controller");src=root/"Windows12.py";src.write_bytes(base64.b64decode(PAYLOAD))
 cfg={"accent":opts["accent"],"gradient":opts["gradient"],"weather_lat":29.4241,"weather_lon":-98.4936,"data_path":str(data)};(root/"config.json").write_text(json.dumps(cfg,indent=2),encoding="utf-8")
 if not (data/"widgets.json").exists():(data/"widgets.json").write_text("[]",encoding="utf-8")
 if not (data/"TaskbarPos.json").exists():(data/"TaskbarPos.json").write_text('{"x":580,"y":930}',encoding="utf-8")
 step(56,"Stopping an older running build");subprocess.run(["taskkill","/F","/T","/IM","Windows12.exe"],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 stage=Path(tempfile.mkdtemp(prefix="Windows12-build-"))
 try:
  step(62,"Building the desktop executable");subprocess.check_call([str(vpy),"-m","PyInstaller","--noconfirm","--clean","--windowed","--onefile","--noupx","--name","Windows12.new","--distpath",str(stage/"dist"),"--workpath",str(stage/"build"),"--specpath",str(stage),str(src)])
  step(82,"Installing the finished executable");built=stage/"dist"/"Windows12.new.exe";exe=root/"Windows12.exe"
  if not built.exists():raise FileNotFoundError("The build did not produce Windows12.new.exe")
  shutil.copy2(built,exe)
 finally:
  if stage:shutil.rmtree(stage,ignore_errors=True)
 step(88,"Creating shortcuts and uninstall support")
 (root/"OnStart.cmd").write_text(f'@echo off\r\nstart "" "{root/"Windows12.exe"}" --boot\r\n',encoding="utf-8")
 (root/"WidgetStudio.cmd").write_text(f'@echo off\r\nstart "" "{root/"Windows12.exe"}" --CreateWidgetPanel\r\n',encoding="utf-8")
 (root/"NewWidget.cmd").write_text(f'@echo off\r\nstart "" "{root/"Windows12.exe"}" --NewWidget\r\n',encoding="utf-8")
 (root/"RefreshContextMenus.cmd").write_text('@echo off\r\nie4uinit.exe -show\r\ntaskkill /F /IM explorer.exe\r\nstart explorer.exe\r\n',encoding="utf-8")
 (root/"Uninstall.cmd").write_text('@echo off\r\ntaskkill /F /T /IM Windows12.exe >nul 2>&1\r\nreg delete "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" /v Windows12Theme /f >nul 2>&1\r\nreg delete "HKLM\\Software\\Classes\\DesktopBackground\\shell\\Windows12Widgets" /f >nul 2>&1\r\nreg delete "HKLM\\Software\\Classes\\DesktopBackground\\shell\\Windows12NewWidget" /f >nul 2>&1\r\nreg delete "HKLM\\Software\\Classes\\Directory\\Background\\shell\\Windows12NewWidget" /f >nul 2>&1\r\nreg delete "HKLM\\Software\\Classes\\Directory\\shell\\Windows12NewWidget" /f >nul 2>&1\r\nreg delete "HKLM\\Software\\Classes\\Folder\\shell\\Windows12NewWidget" /f >nul 2>&1\r\nreg delete "HKLM\\Software\\Classes\\*\\shell\\Windows12NewWidget" /f >nul 2>&1\r\nif /I not "%~1"=="/silent" pause\r\n',encoding="utf-8")
 exe=root/"Windows12.exe"
 step(93,"Registering selected integration options")
 remove_keys()
 if opts["startup"]:
  with winreg.CreateKeyEx(winreg.HKEY_LOCAL_MACHINE,RUN_KEY,0,winreg.KEY_SET_VALUE|winreg.KEY_WOW64_64KEY) as k:winreg.SetValueEx(k,"Windows12Theme",0,winreg.REG_SZ,f'"{exe}" --boot')
 if opts["context"]:
  hive=winreg.HKEY_LOCAL_MACHINE
  access=winreg.KEY_WRITE|winreg.KEY_WOW64_64KEY
  with winreg.CreateKeyEx(hive,CTX_KEY,0,access) as k:
   winreg.SetValueEx(k,"MUIVerb",0,winreg.REG_SZ,"Open Windows 12 Widget Studio")
   winreg.SetValueEx(k,"Icon",0,winreg.REG_SZ,str(exe))
   winreg.SetValueEx(k,"Position",0,winreg.REG_SZ,"Top")
  with winreg.CreateKeyEx(hive,CTX_KEY+r"\command",0,access) as k:winreg.SetValueEx(k,"",0,winreg.REG_SZ,f'"{exe}" --CreateWidgetPanel')
  new_cmd=root/"NewWidget.cmd";command=f'cmd.exe /d /s /c ""{new_cmd}""'
  for key in NEW_WIDGET_KEYS:
   with winreg.CreateKeyEx(hive,key,0,access) as k:
    winreg.SetValueEx(k,"MUIVerb",0,winreg.REG_SZ,"Create a Windows 12 widget")
    winreg.SetValueEx(k,"Icon",0,winreg.REG_SZ,str(exe))
    winreg.SetValueEx(k,"Position",0,winreg.REG_SZ,"Top")
   with winreg.CreateKeyEx(hive,key+r"\command",0,access) as k:winreg.SetValueEx(k,"",0,winreg.REG_SZ,command)
  # Verify registration instead of silently claiming success.
  for key in [CTX_KEY,*NEW_WIDGET_KEYS]:
   with winreg.OpenKey(hive,key+r"\command",0,winreg.KEY_READ|winreg.KEY_WOW64_64KEY) as k:
    if not winreg.QueryValueEx(k,"")[0]:raise RuntimeError("Context menu verification failed: "+key)
  ctypes.windll.shell32.SHChangeNotify(0x08000000,0x0000,None,None)
  subprocess.run(["ie4uinit.exe","-show"],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,check=False)
 step(100,"Installation completed successfully");return exe
def gui():
 import tkinter as tk
 from tkinter import ttk,filedialog,messagebox
 q=queue.Queue();root=tk.Tk();root.title("Windows 12 Setup");root.geometry("760x560");root.resizable(False,False)
 style=ttk.Style();style.theme_use("vista" if "vista" in style.theme_names() else "clam")
 body=tk.Frame(root,padx=38,pady=26);body.pack(fill="both",expand=True);pages=[]
 for _ in range(5):f=tk.Frame(body);pages.append(f)
 nav=tk.Frame(root,padx=24,pady=15);nav.pack(fill="x",side="bottom");back=tk.Button(nav,text="< Back",width=12);nextb=tk.Button(nav,text="Next >",width=12);cancel=tk.Button(nav,text="Cancel",width=12,command=root.destroy);back.pack(side="left");cancel.pack(side="right");nextb.pack(side="right",padx=8)
 state={"page":0,"installing":False,"complete":False,"exe":None}
 install_var=tk.StringVar(value=str(DEFAULT_INSTALL));data_var=tk.StringVar(value=str(DEFAULT_DATA));accent=tk.StringVar(value="#8b5cf6");gradient=tk.StringVar(value="#4c1d95,#a855f7");startup=tk.BooleanVar(value=True);context=tk.BooleanVar(value=True);launch_finish=tk.BooleanVar(value=True)
 def heading(f,title,sub):tk.Label(f,text=title,font=("Segoe UI",24,"bold")).pack(anchor="w",pady=(0,8));tk.Label(f,text=sub,font=("Segoe UI",10),wraplength=660,justify="left").pack(anchor="w",pady=(0,22))
 heading(pages[0],"Welcome to Windows 12 Setup","This wizard will guide you through selecting the installation folder, data folder, appearance, and Windows integration options.");tk.Label(pages[0],text="Click Next to continue.",font=("Segoe UI",11)).pack(anchor="w",pady=30)
 heading(pages[1],"Choose folders","Select where the application and your writable widget data will be stored.")
 def pathrow(f,label,var):
  tk.Label(f,text=label,font=("Segoe UI",10,"bold")).pack(anchor="w");r=tk.Frame(f);r.pack(fill="x",pady=(4,15));tk.Entry(r,textvariable=var).pack(side="left",fill="x",expand=True);tk.Button(r,text="Browse...",command=lambda:var.set(filedialog.askdirectory(initialdir=var.get()) or var.get())).pack(side="right",padx=(8,0))
 pathrow(pages[1],"Application installation path",install_var);pathrow(pages[1],"Widget and settings data path",data_var)
 heading(pages[2],"Customize your installation","Choose the appearance and optional Windows integration features.")
 form=tk.Frame(pages[2]);form.pack(fill="x");tk.Label(form,text="Accent color").grid(row=0,column=0,sticky="w",pady=8);tk.Entry(form,textvariable=accent).grid(row=0,column=1,sticky="ew");tk.Label(form,text="Gradient colors").grid(row=1,column=0,sticky="w",pady=8);tk.Entry(form,textvariable=gradient).grid(row=1,column=1,sticky="ew");form.columnconfigure(1,weight=1)
 tk.Checkbutton(pages[2],text="Start automatically when I sign in",variable=startup).pack(anchor="w",pady=(18,4));tk.Checkbutton(pages[2],text="Add Widget Studio and New Widget to Explorer context menus",variable=context).pack(anchor="w",pady=4)
 heading(pages[3],"Installing Windows 12","Please wait while Setup downloads dependencies and builds the desktop application.");pct=tk.Label(pages[3],text="0%",font=("Segoe UI",22,"bold"));pct.pack(anchor="w");bar=ttk.Progressbar(pages[3],maximum=100,length=650);bar.pack(fill="x",pady=8);current=tk.Label(pages[3],text="Waiting to start...");current.pack(anchor="w",pady=(0,10));log=tk.Text(pages[3],height=15,state="disabled",font=("Consolas",9));log.pack(fill="both",expand=True)
 heading(pages[4],"Setup complete","Windows 12 has been installed with your selected options.");tk.Checkbutton(pages[4],text="Start Windows 12 when I click Finish",variable=launch_finish).pack(anchor="w",pady=25);tk.Label(pages[4],text="Click Finish to close Setup, or Cancel to exit without launching.",wraplength=620,justify="left").pack(anchor="w")
 def show(i):
  for p in pages:p.pack_forget()
  pages[i].pack(fill="both",expand=True);state["page"]=i;back.config(state="normal" if i in (1,2) else "disabled");nextb.config(text="Install" if i==2 else "Finish" if i==4 else "Next >",state="normal");cancel.config(state="normal")
 def emit(item):q.put(item)
 def options():return {"install_path":install_var.get().strip(),"data_path":data_var.get().strip(),"accent":accent.get().strip(),"gradient":gradient.get().strip(),"startup":startup.get(),"context":context.get()}
 def begin():
  if not install_var.get().strip() or not data_var.get().strip():messagebox.showerror("Missing folder","Select both an installation path and a data path.");return
  target=Path(install_var.get().strip())
  if target.exists() and any(target.iterdir()):
   if not messagebox.askyesno("Existing installation","The selected installation folder already contains files. Remove the existing Windows 12 installation and continue?"):return
   try:uninstall_existing(target,lambda x:None)
   except Exception as e:messagebox.showerror("Removal failed",str(e));return
  show(3);state["installing"]=True;nextb.config(state="disabled");back.config(state="disabled");cancel.config(state="disabled")
  def work():
   try:q.put(("done",install(options(),emit)))
   except Exception as e:q.put(("error",e))
  threading.Thread(target=work,daemon=True).start()
 def append(msg):log.config(state="normal");log.insert("end",msg+"\n");log.see("end");log.config(state="disabled")
 def poll():
  try:
   while True:
    item=q.get_nowait()
    if item[0]=="progress":_,n,msg=item;bar["value"]=n;pct.config(text=f"{n}%");current.config(text=msg);append(msg)
    elif item[0]=="done":state.update(installing=False,complete=True,exe=item[1]);show(4)
    elif item[0]=="error":state["installing"]=False;messagebox.showerror("Installation failed",str(item[1]));cancel.config(state="normal");nextb.config(state="normal",text="Retry")
  except queue.Empty:pass
  root.after(100,poll)
 def forward():
  i=state["page"]
  if i<2:show(i+1)
  elif i==2:begin()
  elif i==3 and not state["installing"]:begin()
  elif i==4:
   if launch_finish.get() and state["exe"]:subprocess.Popen([str(state["exe"]),"--boot"])
   root.destroy()
 def backward():show(state["page"]-1)
 nextb.config(command=forward);back.config(command=backward);show(0);root.after(100,poll);root.mainloop()
if __name__=="__main__":
 if os.name!="nt":raise SystemExit("This installer runs on Windows only")
 if not elevated():elevate()
 gui()
