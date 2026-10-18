import ctypes
import os
import shutil
import stat
import subprocess
import sys
import threading
import time
import json
import urllib.request
import zipfile
import tarfile
from pathlib import Path
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, simpledialog
import re


APP_TITLE = "Trusten OS Complete Builder"
ARCH = "amd64"

APP_DIR = Path(__file__).resolve().parent
PROJECT_DIR = APP_DIR / "WinPE_CPP_Builder"

SRC_DIR = PROJECT_DIR / "src"
ISO_OVERLAY_DIR = PROJECT_DIR / "iso_fs_overlay"
WORK_DIR = PROJECT_DIR / "work"
OUT_DIR = PROJECT_DIR / "out"

BUILD_TEMP_DIR = PROJECT_DIR / "build_temp"
ADK_TEMP_DIR = PROJECT_DIR / "adk_temp"
DISM_SCRATCH_DIR = PROJECT_DIR / "dism_scratch"
LOG_DIR = PROJECT_DIR / "logs"

BOOT_SCRIPT_FILE = PROJECT_DIR / "startnet.cmd"

COMPILED_DIR_NAME = "apps"
MINGW_DIR_NAME = "mingw"
PROJECT_SRC_DIR_NAME = "project_src"

DEFAULT_ISO_NAME = "CustomCppWinPE.iso"
LIBRARY_CONFIG_FILE = PROJECT_DIR / "compiler_libraries.txt"
WEB_ASSETS_DIR = PROJECT_DIR / "web"
WEB_ASSETS_DIR_NAME = "web"
CEF_DIR = PROJECT_DIR / "cef"
CEF_DIST_DIR = CEF_DIR / "distribution"
CEF_RUNTIME_DIR_NAME = "cef"
CEF_RUNTIME_STAGE_DIR = CEF_DIR / "runtime_stage"
CEF_BUILDS_INDEX = "https://cef-builds.spotifycdn.com/index.json"
CEF_BUILDS_BASE = "https://cef-builds.spotifycdn.com/"
WEBVIEW2_DIR = PROJECT_DIR / "webview2"
WEBVIEW2_PACKAGE_DIR = WEBVIEW2_DIR / "package"
WEBVIEW2_RUNTIME_DIR = WEBVIEW2_DIR / "runtime"
WEBVIEW2_NUGET_INDEX = "https://api.nuget.org/v3-flatcontainer/microsoft.web.webview2/index.json"
WEBVIEW2_NUGET_BASE = "https://api.nuget.org/v3-flatcontainer/microsoft.web.webview2"
WEBVIEW2_RUNTIME_X64_URL = "https://go.microsoft.com/fwlink/?linkid=2124701"

DEFAULT_MINGW_LIBRARIES = """-ld2d1
-ldwrite
-ldwmapi
-lpdh
-lpsapi
-lshell32
-lole32
-luuid
-lurlmon
-lgdi32
-luser32"""

DEFAULT_MSVC_LIBRARIES = """d2d1.lib
dwrite.lib
dwmapi.lib
pdh.lib
psapi.lib
shell32.lib
ole32.lib
uuid.lib
urlmon.lib
gdi32.lib
user32.lib"""


DEFAULT_CPP = r'''#define WIN32_LEAN_AND_MEAN
#define NOMINMAX
#include <windows.h>
#include <winhttp.h>
#include <windowsx.h>
#include <commdlg.h>
#include <urlmon.h>
#include <wincrypt.h>
#include <tlhelp32.h>
#include <shlobj.h>
#include <algorithm>
#include <array>
#include <cmath>
#include <cstddef>
#include <cstring>
#include <cwctype>
#include <deque>
#include <filesystem>
#include <fstream>
#include <sstream>
#include <stdexcept>
#include <string>
#include <string_view>
#include <vector>
#include <thread>
#include <mutex>
#include <iomanip>
#include <map>
#include <chrono>
#include <atomic>
// Trusten OS Glass Desktop
// TRUSTEN_PERMANENT_MEDIA_SHELLS_V1
// Clean-room single-file C++17 implementation for WinPE / Win32.
// Link: -luser32 -lgdi32 -ladvapi32 -lkernel32 -lole32 -luuid -lwinhttp -lcrypt32 -lcomdlg32 -lshlwapi -lshell32 plus x64 WebView2LoaderStatic.lib

// Trusten single-file application SDK
// External Trusten apps may copy this namespace into their source, or include this
// complete file in SDK-only mode by defining TRUSTEN_SDK_ONLY.
namespace trusten_sdk {
enum class BuiltInApp : int { Files, Terminal, Metrics, Processes, Settings, Notes, Developer, Studio, Browser, Paint, Media, Assistant, Camera, Gallery, Recorder, VideoEditor, About };
constexpr ULONG_PTR NotifyMessage = 0x54524E01;
constexpr ULONG_PTR OpenAppMessage = 0x54524E02;
constexpr ULONG_PTR PickFileMessage = 0x54524E03;
constexpr ULONG_PTR PickFolderMessage = 0x54524E04;
constexpr ULONG_PTR HostWindowMessage = 0x54524E05;
inline HWND findShell(){ return FindWindowW(L"TrustenOS.GlassDesktop", nullptr); }
inline bool notify(HWND shell, const std::wstring& title, const std::wstring& body){
    if(!shell) shell=findShell();
    if(!shell) return false;
    std::wstring payload=title+L"\n"+body;
    COPYDATASTRUCT data{
        NotifyMessage,
        static_cast<DWORD>((payload.size() + 1) * sizeof(wchar_t)),
        const_cast<wchar_t*>(payload.c_str())
    };
    return SendMessageW(shell,WM_COPYDATA,0,(LPARAM)&data)!=0;
}
inline bool openBuiltIn(HWND shell, BuiltInApp app){
    if(!shell) shell=findShell();
    if(!shell) return false;
    int value=(int)app;
    COPYDATASTRUCT data{OpenAppMessage,sizeof(value),(void*)&value};
    return SendMessageW(shell,WM_COPYDATA,0,(LPARAM)&data)!=0;
}
inline bool pickFile(HWND shell,std::wstring& path,const wchar_t* filter=L"All files\0*.*\0\0"){
    if(!shell) shell=findShell(); if(!shell)return false;
    std::vector<wchar_t> buffer(32768); if(!path.empty())wcsncpy(buffer.data(),path.c_str(),buffer.size()-1);
    std::wstring payload=filter; payload.push_back(L'\n'); payload.append(buffer.data());
    payload.resize(32768,L'\0'); COPYDATASTRUCT data{PickFileMessage,(DWORD)(payload.size()*sizeof(wchar_t)),payload.data()};
    if(!SendMessageW(shell,WM_COPYDATA,0,(LPARAM)&data))return false; path.assign(payload.c_str()); return !path.empty();
}
inline bool pickFolder(HWND shell,std::wstring& path){
    if(!shell) shell=findShell(); if(!shell)return false;
    std::vector<wchar_t> buffer(32768); if(!path.empty())wcsncpy(buffer.data(),path.c_str(),buffer.size()-1);
    COPYDATASTRUCT data{PickFolderMessage,(DWORD)(buffer.size()*sizeof(wchar_t)),buffer.data()};
    if(!SendMessageW(shell,WM_COPYDATA,0,(LPARAM)&data))return false; path.assign(buffer.data()); return !path.empty();
}
inline bool hostCustomWindow(HWND shell,HWND child){
    if(!shell) shell=findShell(); if(!shell||!child)return false;
    ULONG_PTR value=(ULONG_PTR)child; COPYDATASTRUCT data{HostWindowMessage,sizeof(value),&value};
    return SendMessageW(shell,WM_COPYDATA,(WPARAM)child,(LPARAM)&data)!=0;
}
}

namespace trusten {

constexpr COLORREF COLOR_BG = RGB(5, 8, 18);
constexpr COLORREF COLOR_PANEL = RGB(18, 29, 48);
constexpr COLORREF COLOR_RAISED = RGB(31, 47, 73);
constexpr COLORREF COLOR_CYAN = RGB(82, 228, 255);
constexpr COLORREF COLOR_VIOLET = RGB(177, 136, 255);
constexpr COLORREF COLOR_TEXT = RGB(241, 249, 255);
constexpr COLORREF COLOR_MUTED = RGB(137, 161, 184);
constexpr COLORREF COLOR_DANGER = RGB(255, 112, 144);
constexpr UINT_PTR TIMER_ANIMATION = 1;
constexpr UINT_PTR TIMER_SYSTEM = 2;
constexpr int WINDOW_TITLE_HEIGHT = 44;
constexpr int RESIZE_EDGE = 9;
constexpr UINT WM_TRUSTEN_AI_DONE = WM_APP + 77;

struct Point { int x{}; int y{}; };
struct Rect {
    int x{}, y{}, width{}, height{};
    RECT native() const { return {x, y, x + width, y + height}; }
    bool contains(Point p) const {
        return p.x >= x && p.y >= y && p.x < x + width && p.y < y + height;
    }
};

enum class Stage { Startup, Lock, Login, Desktop, Shutdown };
enum class DeviceClass { Phone, Tablet, Desktop };
enum class AppType { Files, Terminal, Monitor, Processes, Settings, Notes, Developer, Studio, Browser, Paint, Media, Assistant, Camera, Gallery, Recorder, VideoEditor, About };
enum class WindowLayout { Floating, Tiled, Stacked, Fullscreen };

enum ResizeMask { ResizeNone=0, ResizeLeft=1, ResizeRight=2, ResizeTop=4, ResizeBottom=8 };

struct Theme {
    COLORREF background{COLOR_BG};
    COLORREF panel{COLOR_PANEL};
    COLORREF raised{COLOR_RAISED};
    COLORREF accent{COLOR_CYAN};
    COLORREF accentSecondary{COLOR_VIOLET};
    COLORREF text{COLOR_TEXT};
    COLORREF muted{COLOR_MUTED};
    int cornerRadius{20};
    int glassOpacity{72};
    int density{1};
    bool highContrast{};
};

struct Layout {
    DeviceClass device{DeviceClass::Desktop};
    int width{}, height{};
    int margin{18}, topBar{58}, dock{72}, keyboard{};

    static Layout calculate(int width, int height, bool keyboardVisible) {
        Layout result; result.width=width; result.height=height;
        if (width < 680) {
            result.device=DeviceClass::Phone; result.margin=7; result.dock=62;
        } else if (width < 1100) {
            result.device=DeviceClass::Tablet; result.margin=12; result.dock=68;
        }
        result.keyboard=keyboardVisible ? std::min(292, height*38/100) : 0;
        return result;
    }
    int workspaceBottom() const { return height-dock-keyboard; }
    Rect dockRect() const { return {0,height-dock,width,dock}; }
    Rect keyboardRect() const { return {margin,height-dock-keyboard,width-margin*2,keyboard}; }
    std::wstring name() const {
        if (device==DeviceClass::Phone) return L"PHONE";
        if (device==DeviceClass::Tablet) return L"TABLET";
        return L"DESKTOP";
    }
};

class NativeHandle {
    HANDLE value_{INVALID_HANDLE_VALUE};
public:
    explicit NativeHandle(HANDLE value=INVALID_HANDLE_VALUE):value_(value){}
    ~NativeHandle(){ if(value_ && value_!=INVALID_HANDLE_VALUE) CloseHandle(value_); }
    NativeHandle(const NativeHandle&)=delete;
    NativeHandle& operator=(const NativeHandle&)=delete;
    HANDLE get() const { return value_; }
    bool valid() const { return value_ && value_!=INVALID_HANDLE_VALUE; }
};

class Canvas {
    HDC output_{};
    HDC buffer_{};
    HBITMAP bitmap_{};
    HGDIOBJ previousBitmap_{};
    HFONT normal_{};
    HFONT title_{};
    HFONT mono_{};
    HFONT hero_{};
    int width_{};
    int height_{};
public:
    Canvas(HDC output,int width,int height):output_(output),width_(width),height_(height){
        buffer_=CreateCompatibleDC(output_);
        bitmap_=CreateCompatibleBitmap(output_,width_,height_);
        previousBitmap_=SelectObject(buffer_,bitmap_);
        SetBkMode(buffer_,TRANSPARENT);
        normal_=CreateFontW(-17,0,0,0,FW_NORMAL,FALSE,FALSE,FALSE,DEFAULT_CHARSET,0,0,CLEARTYPE_QUALITY,0,L"Segoe UI");
        title_=CreateFontW(-24,0,0,0,FW_SEMIBOLD,FALSE,FALSE,FALSE,DEFAULT_CHARSET,0,0,CLEARTYPE_QUALITY,0,L"Segoe UI");
        mono_=CreateFontW(-16,0,0,0,FW_NORMAL,FALSE,FALSE,FALSE,DEFAULT_CHARSET,0,0,CLEARTYPE_QUALITY,FIXED_PITCH,L"Consolas");
        hero_=CreateFontW(-54,0,0,0,FW_LIGHT,FALSE,FALSE,FALSE,DEFAULT_CHARSET,0,0,CLEARTYPE_QUALITY,0,L"Segoe UI");
    }
    ~Canvas(){
        BitBlt(output_,0,0,width_,height_,buffer_,0,0,SRCCOPY);
        SelectObject(buffer_,previousBitmap_);
        DeleteObject(bitmap_); DeleteObject(normal_); DeleteObject(title_); DeleteObject(mono_); DeleteObject(hero_);
        DeleteDC(buffer_);
    }
    void fill(Rect rect,COLORREF color){
        RECT native=rect.native(); HBRUSH brush=CreateSolidBrush(color);
        FillRect(buffer_,&native,brush); DeleteObject(brush);
    }
    void clear(COLORREF color){ fill({0,0,width_,height_},color); }
    void rounded(Rect rect,COLORREF color,int radius){
        HBRUSH brush=CreateSolidBrush(color); HPEN pen=CreatePen(PS_NULL,0,color);
        HGDIOBJ oldBrush=SelectObject(buffer_,brush); HGDIOBJ oldPen=SelectObject(buffer_,pen);
        RoundRect(buffer_,rect.x,rect.y,rect.x+rect.width,rect.y+rect.height,radius,radius);
        SelectObject(buffer_,oldPen); SelectObject(buffer_,oldBrush); DeleteObject(pen); DeleteObject(brush);
    }
    void border(Rect rect,COLORREF color,int radius,int width=1){
        HPEN pen=CreatePen(PS_SOLID,width,color); HGDIOBJ oldPen=SelectObject(buffer_,pen);
        HGDIOBJ oldBrush=SelectObject(buffer_,GetStockObject(NULL_BRUSH));
        RoundRect(buffer_,rect.x,rect.y,rect.x+rect.width,rect.y+rect.height,radius,radius);
        SelectObject(buffer_,oldBrush); SelectObject(buffer_,oldPen); DeleteObject(pen);
    }
    void line(int x1,int y1,int x2,int y2,COLORREF color,int width=1){
        HPEN pen=CreatePen(PS_SOLID,width,color); HGDIOBJ old=SelectObject(buffer_,pen);
        MoveToEx(buffer_,x1,y1,nullptr); LineTo(buffer_,x2,y2); SelectObject(buffer_,old); DeleteObject(pen);
    }
    void gradient(Rect rect,COLORREF top,COLORREF bottom){
        for(int y=0;y<rect.height;++y){
            double t=(double)y/std::max(1,rect.height-1);
            COLORREF color=RGB(
                (int)(GetRValue(top)*(1-t)+GetRValue(bottom)*t),
                (int)(GetGValue(top)*(1-t)+GetGValue(bottom)*t),
                (int)(GetBValue(top)*(1-t)+GetBValue(bottom)*t));
            line(rect.x,rect.y+y,rect.x+rect.width,rect.y+y,color);
        }
    }
    void text(std::wstring_view value,Rect rect,COLORREF color,bool title=false,bool mono=false,bool hero=false,
              UINT flags=DT_LEFT|DT_VCENTER|DT_SINGLELINE|DT_END_ELLIPSIS){
        SetTextColor(buffer_,color);
        HGDIOBJ old=SelectObject(buffer_,hero?hero_:(title?title_:(mono?mono_:normal_)));
        RECT native=rect.native(); DrawTextW(buffer_,value.data(),(int)value.size(),&native,flags);
        SelectObject(buffer_,old);
    }
    void bitmap(HBITMAP image, Rect target) {
        if (!image) {
            return;
        }
        BITMAP info{};
        GetObject(image, sizeof(info), &info);
        HDC source = CreateCompatibleDC(buffer_);
        HGDIOBJ old = SelectObject(source, image);
        SetStretchBltMode(buffer_, HALFTONE);
        StretchBlt(buffer_, target.x, target.y, target.width, target.height,
                   source, 0, 0, info.bmWidth, info.bmHeight, SRCCOPY);
        SelectObject(source, old);
        DeleteDC(source);
    }
    void glass(Rect rect,const Theme& theme,bool focused=false){
        int radius=theme.cornerRadius;
        for(int spread=10;spread>=1;--spread){
            COLORREF shadow=RGB(4+spread,7+spread,15+spread*2);
            border({rect.x-spread,rect.y-spread,rect.width+spread*2,rect.height+spread*2},shadow,radius+spread);
        }
        COLORREF top=focused?RGB(42,82,103):RGB(31,47,71);
        COLORREF bottom=focused?RGB(14,34,52):RGB(17,27,45);
        gradient(rect,top,bottom);
        for(int y=rect.y+5;y<rect.y+rect.height-5;y+=6){
            int shimmer=(y/6)%2?8:3;
            line(rect.x+5,y,rect.x+rect.width-5,y,RGB(30+shimmer,46+shimmer,68+shimmer));
        }
        border(rect,focused?theme.accent:RGB(114,132,158),radius,focused?2:1);
        border({rect.x+2,rect.y+2,rect.width-4,rect.height-4},focused?RGB(122,232,246):RGB(82,102,132),std::max(4,radius-2));
        line(rect.x+18,rect.y+2,rect.x+rect.width-18,rect.y+2,focused?RGB(224,255,255):RGB(162,181,208));
        line(rect.x+18,rect.y+rect.height-3,rect.x+rect.width-18,rect.y+rect.height-3,RGB(8,14,25));
    }
};

struct Permissions {
    bool administrator{};
    bool processControl{};
    bool powerControl{};
    static Permissions detect(){
        Permissions result;
        SID_IDENTIFIER_AUTHORITY authority=SECURITY_NT_AUTHORITY;
        PSID group=nullptr;
        if(AllocateAndInitializeSid(&authority,2,SECURITY_BUILTIN_DOMAIN_RID,DOMAIN_ALIAS_RID_ADMINS,0,0,0,0,0,0,&group)){
            BOOL member=FALSE; CheckTokenMembership(nullptr,group,&member);
            result.administrator=member!=FALSE; FreeSid(group);
        }
        result.processControl=result.administrator;
        result.powerControl=result.administrator;
        return result;
    }
};

static std::wstring sanitizeUser(std::wstring input){
    std::wstring output;
    for(wchar_t c:input) if(iswalnum(c)||c==L'_'||c==L'-') output.push_back(c);
    if(output.empty()) output=L"Guest";
    if(output.size()>32) output.resize(32);
    return output;
}

class Workspace {
    std::wstring user_{L"Guest"};
    std::filesystem::path root_;
    static bool writable(const std::filesystem::path& path){
        std::error_code error; std::filesystem::create_directories(path,error);
        auto check=path/L".trusten-write-test";
        std::ofstream file(check,std::ios::binary);
        if(!file) return false;
        file<<"ok"; file.close(); std::filesystem::remove(check,error); return true;
    }
public:
    void open(std::wstring username){
        user_=sanitizeUser(std::move(username)); root_.clear();
        for(wchar_t drive=L'C';drive<=L'Z';++drive){
            std::filesystem::path candidate=std::wstring(1,drive)+L":\\Trusten\\Users\\"+user_;
            UINT type=GetDriveTypeW((std::wstring(1,drive)+L":\\").c_str());
            if((type==DRIVE_FIXED||type==DRIVE_REMOVABLE)&&writable(candidate)){root_=candidate;break;}
        }
        if(root_.empty()) root_=std::filesystem::path(L"X:\\Trusten\\Users")/user_;
        std::error_code error;
        for(auto folder:{L"Desktop",L"Documents",L"Downloads",L"Projects",L"Games",L"Pictures",L"Pictures\\Camera",L"Music",L"Music\\Recordings",L"Videos",L"Videos\\Exports",L"Videos\\Projects",L"Settings",L"AppData"})
            std::filesystem::create_directories(root_/folder,error);
        auto welcome=root_/L"Desktop"/L"Welcome.txt";
        if(!std::filesystem::exists(welcome,error)){
            std::ofstream file(welcome,std::ios::binary);
            file<<"Welcome to Trusten OS Glass Desktop\r\n";
        }
    }
    const std::wstring& user() const{return user_;}
    const std::filesystem::path& root() const{return root_;}
    std::filesystem::path resolve(std::wstring_view relative) const{
        std::filesystem::path path(relative); path=path.lexically_normal();
        if(path.is_absolute()) throw std::runtime_error("absolute path denied");
        for(const auto& part:path) if(part==L"..") throw std::runtime_error("path escape denied");
        return root_/path;
    }
    std::vector<std::filesystem::directory_entry> list(std::wstring_view relative) const{
        std::vector<std::filesystem::directory_entry> output; std::error_code error;
        for(std::filesystem::directory_iterator it(resolve(relative),error),end;!error&&it!=end;it.increment(error)) output.push_back(*it);
        std::sort(output.begin(),output.end(),[](const auto&a,const auto&b){
            if(a.is_directory()!=b.is_directory()) return a.is_directory()>b.is_directory();
            return a.path().filename().wstring()<b.path().filename().wstring();
        });
        return output;
    }
    std::string read(std::wstring_view relative) const{
        std::ifstream file(resolve(relative),std::ios::binary);
        if(!file) throw std::runtime_error("open failed");
        return {std::istreambuf_iterator<char>(file),{}};
    }
    void write(std::wstring_view relative,const std::string& data){
        auto path=resolve(relative); std::error_code error;
        std::filesystem::create_directories(path.parent_path(),error);
        std::ofstream file(path,std::ios::binary|std::ios::trunc);
        if(!file) throw std::runtime_error("write failed");
        file.write(data.data(),(std::streamsize)data.size());
    }
    bool directory(std::wstring_view relative) const{
        std::error_code error; return std::filesystem::is_directory(resolve(relative),error);
    }
};

struct CpuSampler {
    ULONGLONG idle{},kernel{},user{};
    static ULONGLONG value(FILETIME time){ULARGE_INTEGER v{};v.LowPart=time.dwLowDateTime;v.HighPart=time.dwHighDateTime;return v.QuadPart;}
    double sample(){
        FILETIME i{},k{},u{}; if(!GetSystemTimes(&i,&k,&u))return 0;
        auto nextIdle=value(i),nextKernel=value(k),nextUser=value(u);
        auto total=(nextKernel-kernel)+(nextUser-user),free=nextIdle-idle;
        idle=nextIdle;kernel=nextKernel;user=nextUser;
        return total?std::clamp(100.0*(total-free)/total,0.0,100.0):0;
    }
};

struct SystemMetrics {
    CpuSampler sampler; double cpu{}; DWORD memory{};
    std::deque<double> cpuHistory,memoryHistory;
    void update(){
        cpu=sampler.sample(); MEMORYSTATUSEX status{};status.dwLength=sizeof(status);
        if(GlobalMemoryStatusEx(&status))memory=status.dwMemoryLoad;
        cpuHistory.push_back(cpu);memoryHistory.push_back(memory);
        while(cpuHistory.size()>180)cpuHistory.pop_front();
        while(memoryHistory.size()>180)memoryHistory.pop_front();
    }
};

struct ProcessInfo{DWORD pid{},threads{};std::wstring name;};
static std::vector<ProcessInfo> enumerateProcesses(){
    std::vector<ProcessInfo> output;
    NativeHandle snapshot(CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS,0));
    if(!snapshot.valid())return output;
    PROCESSENTRY32W entry{};entry.dwSize=sizeof(entry);
    if(Process32FirstW(snapshot.get(),&entry))do{
        output.push_back({entry.th32ProcessID,entry.cntThreads,entry.szExeFile});
    }while(Process32NextW(snapshot.get(),&entry));
    return output;
}

class TextEditor {
    std::wstring text_; size_t caret_{}; std::vector<std::wstring> undo_;
public:
    const std::wstring& text() const{return text_;}
    size_t caret() const{return caret_;}
    void setCaret(size_t position){caret_=std::min(position,text_.size());}
    void set(std::wstring value){text_=std::move(value);caret_=text_.size();undo_.clear();}
    void insert(wchar_t c){undo_.push_back(text_);text_.insert(text_.begin()+(ptrdiff_t)caret_,c);++caret_;}
    void backspace(){if(caret_){undo_.push_back(text_);text_.erase(--caret_,1);}}
    void moveLeft(){if(caret_>0)--caret_;}
    void moveRight(){if(caret_<text_.size())++caret_;}
    void moveHome(){while(caret_>0&&text_[caret_-1]!=L'\n')--caret_;}
    void moveEnd(){while(caret_<text_.size()&&text_[caret_]!=L'\n')++caret_;}
    void moveUp(){size_t column=0,start=caret_;while(start>0&&text_[start-1]!=L'\n'){--start;++column;}if(start==0)return;size_t previousEnd=start-1,previousStart=previousEnd;while(previousStart>0&&text_[previousStart-1]!=L'\n')--previousStart;caret_=std::min(previousStart+column,previousEnd);}
    void moveDown(){size_t column=0,start=caret_;while(start>0&&text_[start-1]!=L'\n'){--start;++column;}size_t end=caret_;while(end<text_.size()&&text_[end]!=L'\n')++end;if(end>=text_.size())return;size_t nextStart=end+1,nextEnd=nextStart;while(nextEnd<text_.size()&&text_[nextEnd]!=L'\n')++nextEnd;caret_=std::min(nextStart+column,nextEnd);}
    void undo(){if(!undo_.empty()){text_=undo_.back();undo_.pop_back();caret_=std::min(caret_,text_.size());}}
};

struct TouchKeyboard {
    enum class Action{None,Character,Space,Backspace,Shift,Enter,Close};
    struct Result{Action action{Action::None};wchar_t character{};};
    bool visible{},shift{};
    std::array<std::wstring,4> rows{L"1234567890",L"QWERTYUIOP",L"ASDFGHJKL",L"ZXCVBNM"};
    void draw(Canvas& canvas,Rect bounds,const Theme& theme) const{
        if(!visible||bounds.height<100)return;
        canvas.glass(bounds,theme,true);
        int footer=42,gap=5,rowHeight=(bounds.height-footer-16)/4,y=bounds.y+8;
        for(const auto& row:rows){
            int keyWidth=(bounds.width-16-gap*((int)row.size()-1))/(int)row.size(),x=bounds.x+8;
            for(wchar_t c:row){
                Rect key{x,y,keyWidth,rowHeight-gap};
                canvas.gradient(key,RGB(47,63,90),RGB(25,37,58));
                canvas.border(key,theme.accentSecondary,10);
                canvas.text(std::wstring(1,c),key,theme.text,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
                x+=keyWidth+gap;
            }
            y+=rowHeight;
        }
        Rect shiftKey{bounds.x+10,bounds.y+bounds.height-39,76,30};
        Rect spaceKey{bounds.x+94,bounds.y+bounds.height-39,bounds.width-300,30};
        Rect enterKey{bounds.x+bounds.width-198,bounds.y+bounds.height-39,88,30};
        Rect closeKey{bounds.x+bounds.width-102,bounds.y+bounds.height-39,92,30};
        canvas.rounded(shiftKey,shift?theme.accentSecondary:theme.raised,9);
        canvas.rounded(spaceKey,theme.raised,9);canvas.rounded(enterKey,theme.raised,9);canvas.rounded(closeKey,RGB(73,34,48),9);
        canvas.text(L"SHIFT",shiftKey,theme.text,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
        canvas.text(L"SPACE",spaceKey,theme.text,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
        canvas.text(L"ENTER",enterKey,theme.accent,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
        canvas.text(L"CLOSE",closeKey,COLOR_DANGER,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
    }
    Result hit(Point p,Rect bounds) const{
        if(!visible||!bounds.contains(p))return{};
        if(p.y>=bounds.y+bounds.height-44){
            if(p.x<bounds.x+90)return{Action::Shift};
            if(p.x<bounds.x+bounds.width-205)return{Action::Space};
            if(p.x<bounds.x+bounds.width-107)return{Action::Enter};
            return{Action::Close};
        }
        int footer=42,gap=5,rowHeight=(bounds.height-footer-16)/4;
        int rowIndex=std::clamp((p.y-bounds.y-8)/std::max(1,rowHeight),0,3);
        const auto& row=rows[rowIndex];
        int keyWidth=(bounds.width-16-gap*((int)row.size()-1))/(int)row.size();
        int column=(p.x-bounds.x-8)/std::max(1,keyWidth+gap);
        if(column<0||column>=(int)row.size())return{};
        wchar_t c=row[column];if(!shift)c=(wchar_t)towlower(c);
        return{Action::Character,c};
    }
};

struct VirtualWindow {
    int id{}; AppType app{AppType::Files}; std::wstring title;
    Rect bounds{80,90,700,480}; Rect restoreBounds{};
    bool minimized{},maximized{}; int z{};
    float openProgress{}; float minimizeProgress{};
};

class Shell {
    HWND hwnd_{};
    Theme theme_{};
    Layout layout_{};
    Stage stage_{Stage::Startup};
    Permissions permissions_{Permissions::detect()};
    Workspace workspace_{};
    SystemMetrics metrics_{};
    TouchKeyboard keyboard_{};
    TextEditor editor_{};
    int notesScrollLine_{};
    int notesScrollColumn_{};
    std::wstring notesStatus_{L"Ready"};
    std::wstring loginName_,loginPin_,currentDirectory_{L"Desktop"},editorPath_{L"Desktop\\Welcome.txt"},terminalInput_;
    struct Addon{std::wstring id,name,type,entry,description;bool enabled{true};};std::vector<Addon> addons_;bool addonMode_{};std::wstring addonStatus_{L"No addon selected"},addonFile_{L"Projects\\addons\\new-addon.json"};
    std::wstring addressBar_{L"Desktop"};std::vector<std::wstring> fileHistory_{L"Desktop"};int fileHistoryIndex_{};std::vector<std::wstring> pinnedDirs_{L"Desktop",L"Documents",L"Downloads",L"Projects"};
    std::vector<std::wstring> knownUsers_{L"Guest"};bool accountModal_{},accountEditing_{};int loginField_{};std::wstring accountName_,accountPin_;
    std::vector<std::wstring> terminal_{L"Trusten Terminal",L"Type help for commands."};
    std::vector<std::filesystem::directory_entry> files_;
    int selectedFileIndex_{-1};std::wstring filePreviewText_{L"Select a file or folder to preview"};
    std::vector<ProcessInfo> processes_;
    std::vector<VirtualWindow> windows_;
    WindowLayout windowLayout_{WindowLayout::Floating};
    int nextWindowId_{1},topZ_{1},activeWindowId_{},dragWindowId_{},resizeWindowId_{},resizeMask_{},hoverWindowId_{};
    Point dragOffset_{};
    bool launcherVisible_{},shutdownPromptVisible_{},studioMenuVisible_{};
    bool restartRequested_{};
    struct Notification{std::wstring title,body;ULONGLONG created{};};
    std::vector<Notification> notifications_;
    std::mutex notificationMutex_;
    bool notificationCenterVisible_{};
    int settingsTab_{};
    std::wstring updateStatus_{L"CHECK FOR UPDATES"};
    bool updateAvailable_{};
    bool updateCheckRunning_{};
    std::wstring currentExeHash_,remoteIsoHash_;
    bool forgotPinVisible_{};
    HBITMAP bootLogo_{};
    std::wstring bootLogoPath_;
    int forgotPinChoice_{};
    std::wstring resetPin_;
    static constexpr const wchar_t* UPDATE_URL=L"https://archive.org/download/Trusten-OS/CustomCppWinPE.iso";
    static constexpr const wchar_t* UPDATE_METADATA_URL=L"https://archive.org/metadata/Trusten-OS";
    Point studioMenuPoint_{};std::wstring studioFile_{L"Projects\\main.cpp"},studioStatus_{L"Offline C++ workspace ready"};
    enum class ContextKind{None,Background,CppFile,TextFile,OtherFile,Folder};ContextKind contextKind_{ContextKind::None};Point contextPoint_{};int contextFileIndex_{-1};std::wstring contextStatus_{};
    bool taskMenuVisible_{};Point taskMenuPoint_{};int taskMenuIndex_{-1};std::wstring settingsStatus_{L"Settings not saved"};DWORD hostedPid_{};HWND hostedWindow_{};
    bool movePopup_{};int moveSourceIndex_{-1},moveTargetIndex_{};std::vector<std::wstring> moveTargets_;
    float startupProgress_{},shutdownProgress_{};
    double animationPhase_{};
    // Release build: native shell is independent of Chromium.
    int webWindowId_{};
    AppType pendingWebApp_{AppType::Browser};
    std::wstring pendingWebPayload_;
    bool webViewCreating_{};
    bool webViewReady_{};
    std::wstring webViewStatus_{L"Browser component is not installed in this release."};
    std::wstring browserAddress_{L"https://www.bing.com"};
    std::wstring groqKey_;
    std::wstring groqModel_{L"llama-3.3-70b-versatile"};
    bool studioAiVisible_{};
    bool aiBusy_{};
    int aiFocus_{}; // 1 key, 2 prompt
    std::wstring aiPrompt_;
    std::wstring aiAnswer_{L"Enter a Groq API key and ask a question."};
    std::wstring lastBuildOutput_;
    std::mutex aiMutex_;

    std::map<std::wstring,std::chrono::system_clock::time_point> groqBlockedUntil_;
    HBITMAP paintBitmap_{}; std::wstring paintPath_; bool paintDrawing_{}; Point paintLast_{};
    std::wstring mediaPath_; bool mediaPlaying_{};
    std::wstring cameraStatus_{L"Camera shell ready. Capture backend requires a supported device and driver."};
    std::wstring recorderStatus_{L"Recorder shell ready. Recordings: Music\\Recordings"};
    std::wstring editorStatus_{L"Video editor shell ready. Exports: Videos\\Exports"};
    int editorTool_{};
    using MciFn=DWORD (WINAPI*)(LPCWSTR,LPWSTR,UINT,HWND);
    static bool nativePickFile(HWND owner,std::wstring& path,const wchar_t* filter){
        wchar_t file[32768]{}; if(!path.empty())wcsncpy(file,path.c_str(),32767);
        OPENFILENAMEW ofn{};ofn.lStructSize=sizeof(ofn);ofn.hwndOwner=owner;ofn.lpstrFile=file;ofn.nMaxFile=32768;ofn.lpstrFilter=filter;ofn.Flags=OFN_FILEMUSTEXIST|OFN_PATHMUSTEXIST|OFN_NOCHANGEDIR;
        if(!GetOpenFileNameW(&ofn))return false;path=file;return true;
    }
    static bool nativePickFolder(HWND owner,std::wstring& path){
        wchar_t chosen[32768]{};BROWSEINFOW bi{};bi.hwndOwner=owner;bi.pszDisplayName=chosen;bi.lpszTitle=L"Choose a folder";bi.ulFlags=BIF_RETURNONLYFSDIRS|BIF_NEWDIALOGSTYLE;
        PIDLIST_ABSOLUTE id=SHBrowseForFolderW(&bi);if(!id)return false;bool ok=SHGetPathFromIDListW(id,chosen)!=FALSE;CoTaskMemFree(id);if(ok)path=chosen;return ok;
    }
    void loadPaintImage(const std::wstring& path){if(paintBitmap_){DeleteObject(paintBitmap_);paintBitmap_=nullptr;}paintPath_=path;paintBitmap_=(HBITMAP)LoadImageW(nullptr,path.c_str(),IMAGE_BITMAP,0,0,LR_LOADFROMFILE|LR_CREATEDIBSECTION);if(!paintBitmap_)notify(L"Paint",L"Native loader currently requires a BMP image.");repaint();}
    void mediaCommand(const std::wstring& command){HMODULE m=LoadLibraryW(L"winmm.dll");if(!m){notify(L"Media",L"winmm.dll is unavailable.");return;}auto raw=GetProcAddress(m,"mciSendStringW");MciFn fn=nullptr;std::memcpy(&fn,&raw,sizeof(fn));if(fn)fn(command.c_str(),nullptr,0,hwnd_);FreeLibrary(m);}
    void loadMedia(const std::wstring& path){mediaCommand(L"close trustenmedia");mediaPath_=path;mediaCommand(L"open \""+path+L"\" alias trustenmedia");mediaPlaying_=false;repaint();}
    void hostSdkWindow(HWND child){if(!IsWindow(child))return;LONG_PTR style=GetWindowLongPtrW(child,GWL_STYLE);style=(style&~WS_POPUP)|WS_CHILD;SetWindowLongPtrW(child,GWL_STYLE,style);SetParent(child,hwnd_);SetWindowPos(child,HWND_TOP,layout_.margin+40,layout_.topBar+70,std::max(320,layout_.width/2),std::max(220,layout_.workspaceBottom()/2),SWP_SHOWWINDOW|SWP_FRAMECHANGED);}
    static std::wstring webFileUrl(const std::filesystem::path& path){std::wstring v=path.wstring();std::replace(v.begin(),v.end(),L'\\',L'/');return L"file:///"+v;}
    static bool imageFile(const std::filesystem::path&p){auto e=p.extension().wstring();std::transform(e.begin(),e.end(),e.begin(),::towlower);return e==L".png"||e==L".jpg"||e==L".jpeg"||e==L".bmp"||e==L".gif"||e==L".webp"||e==L".ico"||e==L".tif"||e==L".tiff";}
    static bool mediaFile(const std::filesystem::path&p){auto e=p.extension().wstring();std::transform(e.begin(),e.end(),e.begin(),::towlower);return e==L".mp4"||e==L".webm"||e==L".mkv"||e==L".mov"||e==L".avi"||e==L".mp3"||e==L".wav"||e==L".ogg"||e==L".m4a"||e==L".flac";}
    void syncWebView(){}
    void loadPendingWebApp(){}
    void initWebView(){webViewCreating_=false;webViewReady_=false;webViewStatus_=L"Browser component is unavailable; Trusten remains active.";repaint();}
    void showWebApp(int id,AppType app,const std::wstring& payload=L""){webWindowId_=id;pendingWebApp_=app;pendingWebPayload_=payload;initWebView();}
    static std::string utf8(const std::wstring& value){if(value.empty())return {};int n=WideCharToMultiByte(CP_UTF8,0,value.data(),(int)value.size(),nullptr,0,nullptr,nullptr);std::string out((size_t)n,'\0');WideCharToMultiByte(CP_UTF8,0,value.data(),(int)value.size(),out.data(),n,nullptr,nullptr);return out;}
    static std::wstring wide(const std::string& value){if(value.empty())return {};int n=MultiByteToWideChar(CP_UTF8,0,value.data(),(int)value.size(),nullptr,0);std::wstring out((size_t)n,L'\0');MultiByteToWideChar(CP_UTF8,0,value.data(),(int)value.size(),out.data(),n);return out;}
    static std::string jsonEscape(const std::string& value){std::string out;for(unsigned char c:value){switch(c){case '\\':out+="\\\\";break;case '"':out+="\\\"";break;case '\n':out+="\\n";break;case '\r':out+="\\r";break;case '\t':out+="\\t";break;default:if(c>=32)out+=(char)c;}}return out;}
    static std::string jsonContent(const std::string& json){auto p=json.find("\\\"content\\\"");if(p==std::string::npos)return {};p=json.find(':',p);p=json.find('"',p);if(p==std::string::npos)return {};++p;std::string out;bool esc=false;for(;p<json.size();++p){char c=json[p];if(esc){if(c=='n')out+='\n';else if(c=='r')out+='\r';else if(c=='t')out+='\t';else out+=c;esc=false;}else if(c=='\\')esc=true;else if(c=='"')break;else out+=c;}return out;}
    std::wstring groqRequest(const std::wstring& prompt){
        if(groqKey_.empty())return L"Enter your Groq API key first.";
        HINTERNET session=WinHttpOpen(L"TrustenOS/1.0",WINHTTP_ACCESS_TYPE_AUTOMATIC_PROXY,WINHTTP_NO_PROXY_NAME,WINHTTP_NO_PROXY_BYPASS,0);if(!session)return L"WinHTTP session failed.";
        HINTERNET connect=WinHttpConnect(session,L"api.groq.com",INTERNET_DEFAULT_HTTPS_PORT,0);if(!connect){WinHttpCloseHandle(session);return L"Groq connection failed.";}
        HINTERNET request=WinHttpOpenRequest(connect,L"POST",L"/openai/v1/chat/completions",nullptr,WINHTTP_NO_REFERER,WINHTTP_DEFAULT_ACCEPT_TYPES,WINHTTP_FLAG_SECURE);if(!request){WinHttpCloseHandle(connect);WinHttpCloseHandle(session);return L"Groq request setup failed.";}
        std::string key=utf8(groqKey_),model=utf8(groqModel_),question=utf8(prompt);
        std::string body="{\"model\":\""+jsonEscape(model)+"\",\"messages\":[{\"role\":\"system\",\"content\":\"You are the Trusten OS assistant and C++ Studio coding partner. Return concise, directly usable help.\"},{\"role\":\"user\",\"content\":\""+jsonEscape(question)+"\"}]}";
        std::wstring headers=L"Content-Type: application/json\r\nAuthorization: Bearer "+groqKey_+L"\r\n";
        BOOL ok=WinHttpSendRequest(request,headers.c_str(),(DWORD)-1,(LPVOID)body.data(),(DWORD)body.size(),(DWORD)body.size(),0)&&WinHttpReceiveResponse(request,nullptr);
        std::string response;if(ok){for(;;){DWORD available=0;if(!WinHttpQueryDataAvailable(request,&available)||!available)break;size_t old=response.size();response.resize(old+available);DWORD got=0;if(!WinHttpReadData(request,response.data()+old,available,&got))break;response.resize(old+got);}}
        DWORD status=0,size=sizeof(status);WinHttpQueryHeaders(request,WINHTTP_QUERY_STATUS_CODE|WINHTTP_QUERY_FLAG_NUMBER,WINHTTP_HEADER_NAME_BY_INDEX,&status,&size,WINHTTP_NO_HEADER_INDEX);
        WinHttpCloseHandle(request);WinHttpCloseHandle(connect);WinHttpCloseHandle(session);
        if(!ok)return L"Groq request failed. Check WinPE networking and system time.";auto content=jsonContent(response);if(status<200||status>=300)return L"Groq error HTTP "+std::to_wstring(status)+L": "+wide(content.empty()?response:content);return content.empty()?L"Groq returned no message content.":wide(content);
    }
    void sendAi(bool studio){if(aiBusy_||aiPrompt_.empty())return;std::wstring prompt=aiPrompt_;if(studio){try{prompt=L"Current file: "+studioFile_+L"\n\nSource:\n"+wide(workspace_.read(studioFile_))+L"\n\nLast build output:\n"+lastBuildOutput_+L"\n\nRequest:\n"+prompt;}catch(...){}}aiBusy_=true;aiAnswer_=L"Thinking...";std::thread([this,prompt]{auto answer=groqRequest(prompt);{std::lock_guard<std::mutex> lock(aiMutex_);aiAnswer_=std::move(answer);aiBusy_=false;}PostMessageW(hwnd_,WM_TRUSTEN_AI_DONE,0,0);}).detach();repaint();}
    void drawNativeAi(Canvas& canvas,Rect content,bool studio){int side=studio&&studioAiVisible_?std::min(390,content.width/2):content.width;Rect panel{studio?content.x+content.width-side:content.x,content.y,side,content.height};canvas.glass(panel,theme_,true);int x=panel.x+12,y=panel.y+10,w=panel.width-24;canvas.text(studio?L"STUDIO AI":L"TRUSTEN AI",{x,y,w-(studio?88:0),30},theme_.accent,true);if(studio){Rect close{panel.x+panel.width-92,panel.y+8,80,30};canvas.glass(close,theme_,true);canvas.text(L"CLOSE",close,COLOR_DANGER,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);}y+=38;Rect key{x,y,w,34};canvas.rounded(key,theme_.raised,9);canvas.border(key,aiFocus_==1?theme_.accent:theme_.muted,9);canvas.text(L"API KEY: "+(groqKey_.empty()?L"enter key":std::wstring(groqKey_.size(),L'*')),{x+8,y,w-16,34},theme_.text,false,true);y+=42;Rect output{x,y,w,std::max(80,panel.height-174)};canvas.glass(output,theme_);std::wistringstream lines(aiAnswer_);std::wstring line;int oy=y+8;while(std::getline(lines,line)&&oy+19<output.y+output.height){for(size_t at=0;at<line.size()&&oy+19<output.y+output.height;at+=std::max(1,(w-20)/9)){canvas.text(line.substr(at,(size_t)std::max(1,(w-20)/9)),{x+8,oy,w-16,19},theme_.text,false,true);oy+=19;}}y=output.y+output.height+8;Rect prompt{x,y,w-92,38},send{x+w-84,y,84,38};canvas.rounded(prompt,theme_.raised,9);canvas.border(prompt,aiFocus_==2?theme_.accent:theme_.muted,9);canvas.text(aiPrompt_.empty()?L"Ask Trusten AI...":aiPrompt_+L"_",{prompt.x+8,prompt.y,prompt.width-16,prompt.height},theme_.text,false,true);canvas.gradient(send,theme_.accentSecondary,theme_.accent);canvas.text(aiBusy_?L"WAIT":L"SEND",send,RGB(4,10,18),true,false,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);}
    void repaint(){InvalidateRect(hwnd_,nullptr,FALSE);}
    VirtualWindow* findWindow(int id){for(auto& window:windows_)if(window.id==id)return&window;return nullptr;}
    VirtualWindow* activeWindow(){return findWindow(activeWindowId_);}
    Rect actualBounds(const VirtualWindow& window) const{
        if(window.maximized)return{layout_.margin,layout_.topBar,layout_.width-layout_.margin*2,layout_.workspaceBottom()-layout_.topBar-layout_.margin};
        return window.bounds;
    }
    void focusWindow(int id){if(auto*window=findWindow(id)){window->z=++topZ_;window->minimized=false;activeWindowId_=id;}}
    void closeWindow(int id){
        windows_.erase(std::remove_if(windows_.begin(),windows_.end(),[&](const auto&w){return w.id==id;}),windows_.end());
        if(activeWindowId_==id)activeWindowId_=windows_.empty()?0:windows_.back().id;
    }
    void updateFilePreview(int index){selectedFileIndex_=index;if(index<0||index>=(int)files_.size()){filePreviewText_=L"Select a file or folder to preview";return;}try{auto&entry=files_[index];if(entry.is_directory()){size_t count=0;std::error_code ec;for(std::filesystem::directory_iterator it(entry.path(),ec),end;!ec&&it!=end&&count<100;it.increment(ec))++count;filePreviewText_=L"Folder: "+entry.path().filename().wstring()+L"\nItems: "+std::to_wstring(count)+L"\nPath: "+entry.path().wstring();return;}auto ext=entry.path().extension().wstring();std::transform(ext.begin(),ext.end(),ext.begin(),::towlower);if(ext==L".txt"||ext==L".cpp"||ext==L".h"||ext==L".hpp"||ext==L".ini"||ext==L".json"||ext==L".log"||ext==L".bat"||ext==L".cmd"){std::ifstream in(entry.path(),std::ios::binary);std::string bytes;bytes.resize(4096);in.read(bytes.data(),(std::streamsize)bytes.size());bytes.resize((size_t)in.gcount());filePreviewText_=std::wstring(bytes.begin(),bytes.end());if(filePreviewText_.empty())filePreviewText_=L"Empty text file";}else{std::error_code ec;auto size=std::filesystem::file_size(entry.path(),ec);filePreviewText_=L"File: "+entry.path().filename().wstring()+L"\nSize: "+(ec?L"Unknown":std::to_wstring(size)+L" bytes")+L"\nPreview is available for text and code files.";}}catch(...){filePreviewText_=L"Preview unavailable";}}
    void refreshFiles(){try{files_=workspace_.list(currentDirectory_);addressBar_=currentDirectory_;}catch(...){files_.clear();}}
    void navigateFiles(std::wstring path,bool record=true){try{if(!workspace_.directory(path))return;currentDirectory_=path;selectedFileIndex_=-1;filePreviewText_=L"Select a file or folder to preview";refreshFiles();if(record){if(fileHistoryIndex_+1<(int)fileHistory_.size())fileHistory_.erase(fileHistory_.begin()+fileHistoryIndex_+1,fileHistory_.end());fileHistory_.push_back(path);fileHistoryIndex_=(int)fileHistory_.size()-1;}}catch(...){}}
    void savePinned(){try{auto path=workspace_.resolve(L"AppData\\Roaming\\Files\\Pinned\\pinned.json");std::filesystem::create_directories(path.parent_path());std::ofstream out(path,std::ios::trunc);out<<"[\n";for(size_t i=0;i<pinnedDirs_.size();++i)out<<"  \""<<std::string(pinnedDirs_[i].begin(),pinnedDirs_[i].end())<<"\""<<(i+1<pinnedDirs_.size()?",":"")<<"\n";out<<"]\n";}catch(...){}}
    void saveAccount(){try{std::wstring old=workspace_.user();std::wstring name=accountName_.empty()?loginName_:accountName_;if(name.empty()||accountPin_.empty()){settingsStatus_=L"Username and PIN required";return;}workspace_.open(name);auto profile=workspace_.resolve(L"AppData\\Roaming\\profile.ini");std::filesystem::create_directories(profile.parent_path());std::ofstream out(profile,std::ios::trunc);out<<"username="<<std::string(name.begin(),name.end())<<"\npin="<<std::string(accountPin_.begin(),accountPin_.end())<<"\n";loginName_=name;loginPin_=accountPin_;if(std::find(knownUsers_.begin(),knownUsers_.end(),name)==knownUsers_.end())knownUsers_.push_back(name);settingsStatus_=L"Account saved";accountModal_=false;}catch(...){settingsStatus_=L"Account save failed";}}
    void drawAccountModal(Canvas& canvas){if(!accountModal_)return;int width=std::min(480,layout_.width-40);Rect panel{(layout_.width-width)/2,layout_.height/2-170,width,340};canvas.glass(panel,theme_,true);canvas.text(accountEditing_?L"MODIFY ACCOUNT":L"CREATE ACCOUNT",{panel.x+20,panel.y+18,panel.width-40,38},theme_.text,true,false,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);Rect user{panel.x+38,panel.y+82,panel.width-76,50},pin{panel.x+38,panel.y+151,panel.width-76,50};canvas.rounded(user,theme_.raised,13);canvas.rounded(pin,theme_.raised,13);canvas.border(loginField_==0?user:pin,theme_.accent,13,2);canvas.text(L"Username: "+accountName_+(loginField_==0?L"_":L""),{user.x+12,user.y,user.width-24,user.height},theme_.text,false,true);canvas.text(L"PIN: "+std::wstring(accountPin_.size(),L'*')+(loginField_==1?L"_":L""),{pin.x+12,pin.y,pin.width-24,pin.height},theme_.text,false,true);Rect save{panel.x+60,panel.y+242,150,48},cancel{panel.x+panel.width-210,panel.y+242,150,48};canvas.gradient(save,theme_.accentSecondary,theme_.accent);canvas.rounded(cancel,theme_.raised,13);canvas.text(L"SAVE",save,RGB(4,10,18),true,false,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);canvas.text(L"CANCEL",cancel,theme_.text,true,false,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);}

    void collectMoveTargets(const std::wstring& relative,int depth){if(depth>6)return;moveTargets_.push_back(relative);try{for(const auto&entry:workspace_.list(relative))if(entry.is_directory())collectMoveTargets(relative+(relative.empty()?L"":L"\\")+entry.path().filename().wstring(),depth+1);}catch(...){}}
    void openMovePopup(int index){if(index<0||index>=(int)files_.size())return;moveSourceIndex_=index;moveTargetIndex_=0;moveTargets_.clear();for(auto root:{L"Desktop",L"Documents",L"Projects"})collectMoveTargets(root,0);movePopup_=true;}
    void performMoveSelection(){if(moveSourceIndex_<0||moveSourceIndex_>=(int)files_.size()||moveTargetIndex_<0||moveTargetIndex_>=(int)moveTargets_.size()){movePopup_=false;return;}try{auto source=workspace_.resolve(relativeEntry(moveSourceIndex_));auto folder=workspace_.resolve(moveTargets_[moveTargetIndex_]);std::filesystem::create_directories(folder);auto target=folder/source.filename();int n=1;while(std::filesystem::exists(target))target=folder/(source.stem().wstring()+L"_"+std::to_wstring(n++)+source.extension().wstring());std::filesystem::rename(source,target);contextStatus_=L"Moved to "+moveTargets_[moveTargetIndex_];refreshFiles();}catch(...){contextStatus_=L"Move failed";}movePopup_=false;}
    void drawMovePopup(Canvas& canvas){if(!movePopup_)return;int width=std::min(560,layout_.width-40),height=std::min(520,layout_.height-80);Rect panel{(layout_.width-width)/2,(layout_.height-height)/2,width,height};canvas.glass(panel,theme_,true);canvas.text(L"MOVE INTO DIRECTORY",{panel.x+18,panel.y+12,panel.width-36,38},theme_.text,true,false,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);canvas.text(L"Choose a destination from the folder tree",{panel.x+22,panel.y+52,panel.width-44,25},theme_.muted);Rect tree{panel.x+22,panel.y+84,panel.width-44,panel.height-160};canvas.glass(tree,theme_);int y=tree.y+8;for(size_t i=0;i<moveTargets_.size()&&y+30<tree.y+tree.height;++i){int depth=(int)std::count(moveTargets_[i].begin(),moveTargets_[i].end(),L'\\');Rect row{tree.x+8,y,tree.width-16,28};if((int)i==moveTargetIndex_)canvas.glass(row,theme_,true);auto name=std::filesystem::path(moveTargets_[i]).filename().wstring();canvas.text(std::wstring(depth*2,L' ')+L"[DIR] "+name,row,(int)i==moveTargetIndex_?theme_.accent:theme_.text,false,true);y+=30;}Rect move{panel.x+52,panel.y+panel.height-62,180,44},cancel{panel.x+panel.width-232,panel.y+panel.height-62,180,44};canvas.gradient(move,theme_.accentSecondary,theme_.accent);canvas.rounded(cancel,theme_.raised,12);canvas.text(L"MOVE HERE",move,RGB(4,10,18),true,false,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);canvas.text(L"CANCEL",cancel,theme_.text,true,false,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);}
    void drawDesktopFiles(Canvas& canvas){std::vector<std::filesystem::directory_entry> desktop;try{desktop=workspace_.list(L"Desktop");}catch(...){return;}int iconW=112,iconH=82,gap=14,startX=24,startY=layout_.topBar+22,columns=std::max(1,(layout_.width-48)/(iconW+gap));for(size_t i=0;i<desktop.size();++i){int col=(int)i%columns,row=(int)i/columns;Rect icon{startX+col*(iconW+gap),startY+row*(iconH+gap),iconW,iconH};if(icon.y+icon.height>=layout_.workspaceBottom())break;canvas.glass(icon,theme_);canvas.text(desktop[i].is_directory()?L"[DIR]":L"[FILE]",{icon.x+8,icon.y+7,icon.width-16,26},desktop[i].is_directory()?theme_.accent:theme_.accentSecondary,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);canvas.text(desktop[i].path().filename().wstring(),{icon.x+7,icon.y+34,icon.width-14,40},theme_.text,false,false,false,DT_CENTER|DT_WORDBREAK|DT_END_ELLIPSIS);}}
    void refreshProcesses(){processes_=enumerateProcesses();}
    std::wstring jsonValue(const std::wstring& source,const std::wstring& key){std::wstring mark=L"\""+key+L"\"";auto p=source.find(mark);if(p==std::wstring::npos)return L"";p=source.find(L':',p+mark.size());if(p==std::wstring::npos)return L"";p=source.find(L'\"',p+1);if(p==std::wstring::npos)return L"";auto e=source.find(L'\"',p+1);if(e==std::wstring::npos)return L"";return source.substr(p+1,e-p-1);}
    std::filesystem::path addonRoot(){auto root=workspace_.resolve(L"AppData\\Roaming\\TrustenOS\\Addons");std::filesystem::create_directories(root);return root;}
    void loadAddons(){addons_.clear();try{std::error_code ec;for(std::filesystem::directory_iterator it(addonRoot(),ec),end;!ec&&it!=end;it.increment(ec)){if(!it->is_regular_file()||it->path().extension()!=L".json")continue;std::ifstream in(it->path(),std::ios::binary);std::string bytes((std::istreambuf_iterator<char>(in)),{});std::wstring json(bytes.begin(),bytes.end());Addon a;a.id=jsonValue(json,L"id");a.name=jsonValue(json,L"name");a.type=jsonValue(json,L"type");a.entry=jsonValue(json,L"entry");a.description=jsonValue(json,L"description");if(a.id.empty())a.id=it->path().stem().wstring();if(a.name.empty())a.name=a.id;if(a.type.empty())a.type=L"feature";addons_.push_back(a);}}catch(...){addonStatus_=L"Could not load addons";}}
    void installAddonManifest(const std::wstring& relative){try{auto source=workspace_.resolve(relative);if(source.extension()!=L".json"){addonStatus_=L"Addon must be a JSON file";return;}std::ifstream in(source,std::ios::binary);std::string bytes((std::istreambuf_iterator<char>(in)),{});std::wstring json(bytes.begin(),bytes.end());auto id=jsonValue(json,L"id"),name=jsonValue(json,L"name"),type=jsonValue(json,L"type");if(id.empty()||name.empty()||type.empty()){addonStatus_=L"JSON requires id, name and type";return;}auto target=addonRoot()/(id+L".json");std::filesystem::copy_file(source,target,std::filesystem::copy_options::overwrite_existing);loadAddons();addonStatus_=L"Installed "+name;}catch(...){addonStatus_=L"Addon install failed";}}
    void createAddonTemplate(){try{auto path=workspace_.resolve(addonFile_);std::filesystem::create_directories(path.parent_path());std::string json="{\r\n  \"id\": \"my-addon\",\r\n  \"name\": \"My Addon\",\r\n  \"type\": \"app\",\r\n  \"entry\": \"Projects\\\\addons\\\\my-addon.exe\",\r\n  \"description\": \"Custom Trusten OS addon\"\r\n}\r\n";workspace_.write(addonFile_,json);editor_.set(std::wstring(json.begin(),json.end()));editorPath_=addonFile_;openWindow(AppType::Notes);addonMode_=true;addonStatus_=L"Addon JSON template created";}catch(...){addonStatus_=L"Could not create addon template";}}
    void runAddon(int index){if(index<0||index>=(int)addons_.size())return;auto&a=addons_[index];if(a.type==L"app"&&!a.entry.empty()){try{auto exe=workspace_.resolve(a.entry);STARTUPINFOW si{};si.cb=sizeof(si);PROCESS_INFORMATION pi{};std::wstring command=L"\""+exe.wstring()+L"\"";std::vector<wchar_t> mutableCommand(command.begin(),command.end());mutableCommand.push_back(0);if(CreateProcessW(nullptr,mutableCommand.data(),nullptr,nullptr,FALSE,0,nullptr,exe.parent_path().c_str(),&si,&pi)){CloseHandle(pi.hThread);CloseHandle(pi.hProcess);addonStatus_=L"Launched "+a.name;}else addonStatus_=L"Launch failed";}catch(...){addonStatus_=L"Invalid addon entry";}}else addonStatus_=a.name+L" feature enabled";}

    void notify(std::wstring title,std::wstring body){
        std::lock_guard<std::mutex> lock(notificationMutex_);
        notifications_.push_back({std::move(title),std::move(body),GetTickCount64()});
        while(notifications_.size()>30)notifications_.erase(notifications_.begin());
        repaint();
    }
    static std::wstring sha256File(const std::filesystem::path& path){
        std::ifstream in(path,std::ios::binary);if(!in)return L"";
        HCRYPTPROV provider{};HCRYPTHASH hash{};
        if(!CryptAcquireContextW(&provider,nullptr,nullptr,PROV_RSA_AES,CRYPT_VERIFYCONTEXT))return L"";
        if(!CryptCreateHash(provider,CALG_SHA_256,0,0,&hash)){CryptReleaseContext(provider,0);return L"";}
        char block[65536];while(in){in.read(block,sizeof(block));auto count=(DWORD)in.gcount();if(count&&!CryptHashData(hash,(BYTE*)block,count,0)){CryptDestroyHash(hash);CryptReleaseContext(provider,0);return L"";}}
        BYTE digest[32]{};DWORD size=sizeof(digest);std::wostringstream out;
        if(CryptGetHashParam(hash,HP_HASHVAL,digest,&size,0))for(DWORD i=0;i<size;++i)out<<std::hex<<std::setw(2)<<std::setfill(L'0')<<(int)digest[i];
        CryptDestroyHash(hash);CryptReleaseContext(provider,0);return out.str();
    }
    std::filesystem::path updateStatePath(){return workspace_.root()/L"AppData"/L"Roaming"/L"TrustenOS"/L"update-state.ini";}
    static std::wstring jsonFieldAfter(const std::string& json,
                                       const std::string& filename,
                                       const std::string& field) {
        auto file = json.find("\"name\":\"" + filename + "\"");
        if (file == std::string::npos) {
            return L"";
        }
        auto end = json.find("}", file);
        auto key = json.find("\"" + field + "\":\"", file);
        if (key == std::string::npos || key > end) {
            return L"";
        }
        key += field.size() + 6;
        auto close = json.find('"', key);
        if (close == std::string::npos) {
            return L"";
        }
        auto value = json.substr(key, close - key);
        return std::wstring(value.begin(), value.end());
    }
    bool runWpeutil(const wchar_t* action){
        wchar_t system[MAX_PATH]{};GetSystemDirectoryW(system,MAX_PATH);
        std::filesystem::path exe=std::filesystem::path(system)/L"wpeutil.exe";
        if(!std::filesystem::exists(exe))exe=L"wpeutil.exe";
        std::wstring command=L"\""+exe.wstring()+L"\" "+action;
        STARTUPINFOW si{};si.cb=sizeof(si);PROCESS_INFORMATION pi{};
        std::vector<wchar_t> mutableCommand(command.begin(),command.end());mutableCommand.push_back(0);
        if(!CreateProcessW(nullptr,mutableCommand.data(),nullptr,nullptr,FALSE,CREATE_NO_WINDOW,nullptr,nullptr,&si,&pi))return false;
        CloseHandle(pi.hThread);CloseHandle(pi.hProcess);return true;
    }
    static HRESULT downloadUrlToFile(const wchar_t* url, const std::filesystem::path& destination) {
        using DownloadFn = HRESULT (WINAPI*)(LPUNKNOWN, LPCWSTR, LPCWSTR, DWORD, LPBINDSTATUSCALLBACK);
        HMODULE module = LoadLibraryW(L"urlmon.dll");
        if (!module) {
            wchar_t systemDirectory[MAX_PATH]{};
            GetSystemDirectoryW(systemDirectory, MAX_PATH);
            std::filesystem::path fullPath = std::filesystem::path(systemDirectory) / L"urlmon.dll";
            module = LoadLibraryW(fullPath.c_str());
        }
        if (!module) {
            return HRESULT_FROM_WIN32(GetLastError());
        }
        FARPROC procedure = GetProcAddress(module, "URLDownloadToFileW");
        if (!procedure) {
            DWORD error = GetLastError();
            FreeLibrary(module);
            return HRESULT_FROM_WIN32(error);
        }
        static_assert(sizeof(DownloadFn) == sizeof(procedure));
        DownloadFn function = nullptr;
        std::memcpy(&function, &procedure, sizeof(function));
        HRESULT result = function(nullptr, url, destination.c_str(), 0, nullptr);
        FreeLibrary(module);
        return result;
    }
    void checkForUpdates(bool quiet){
        if (updateCheckRunning_) {
            return;
        }
        updateCheckRunning_ = true;
        updateStatus_ = L"CHECKING...";
        repaint();
        std::thread([this,quiet]{
            wchar_t exe[MAX_PATH]{};GetModuleFileNameW(nullptr,exe,MAX_PATH);currentExeHash_=sha256File(exe);
            auto temp=std::filesystem::temp_directory_path()/L"TrustenOS-metadata.json";
            HRESULT hr = downloadUrlToFile(UPDATE_METADATA_URL, temp);
            if(SUCCEEDED(hr)){
                std::ifstream metadata(temp,std::ios::binary);
                std::string json((std::istreambuf_iterator<char>(metadata)),{});
                remoteIsoHash_=jsonFieldAfter(json,"CustomCppWinPE.iso","sha1");
                if(remoteIsoHash_.empty())remoteIsoHash_=jsonFieldAfter(json,"CustomCppWinPE.iso","md5");
            }
            std::wstring previous;try{std::ifstream in(updateStatePath());std::string line;std::getline(in,line);previous.assign(line.begin(),line.end());}catch(...){}
            if(SUCCEEDED(hr)&&!remoteIsoHash_.empty()){
                updateAvailable_=!previous.empty()&&previous!=remoteIsoHash_;
                updateStatus_=updateAvailable_?L"UPDATE":L"UP TO DATE";
                if(updateAvailable_)notify(L"Trusten OS update",L"A different WinPE ISO is available. Open Settings > Updates.");
                else if(!quiet)notify(L"Update check",L"Trusten OS is up to date.");
                try{auto state=updateStatePath();std::filesystem::create_directories(state.parent_path());std::ofstream out(state,std::ios::trunc);out<<std::string(remoteIsoHash_.begin(),remoteIsoHash_.end());}catch(...){}
             } else {
                updateStatus_ = L"CHECK FAILED";
                if (!quiet) notify(L"Update check",L"Could not read the Archive update metadata. URLMon may be unavailable in this WinPE image.");
            }
            std::error_code ec;std::filesystem::remove(temp,ec);updateCheckRunning_=false;repaint();
        }).detach();
    }
    void recordLastUse(){try{auto path=workspace_.root()/L"AppData"/L"Roaming"/L"profile.ini";std::ofstream out(path,std::ios::app);SYSTEMTIME t{};GetLocalTime(&t);out<<"lastUsed="<<t.wYear<<"-"<<t.wMonth<<"-"<<t.wDay<<" "<<t.wHour<<":"<<t.wMinute<<"\n";}catch(...){}}
    std::wstring lastUseReminder(){try{auto path=workspace_.root()/L"AppData"/L"Roaming"/L"profile.ini";std::ifstream in(path);std::string line,last;while(std::getline(in,line))if(line.rfind("lastUsed=",0)==0)last=line.substr(9);return last.empty()?L"No previous use recorded.":L"Last used: "+std::wstring(last.begin(),last.end());}catch(...){return L"No previous use recorded.";}}
    void showUnavailable(const wchar_t* operation){
        std::wstring message=operation;message+=L" is unavailable because this session lacks the required permission.";
        MessageBoxW(hwnd_,message.c_str(),L"Trusten OS permissions",MB_OK|MB_ICONINFORMATION);
    }
    static bool enableShutdownPrivilege(){
        HANDLE token=nullptr;
        if(!OpenProcessToken(GetCurrentProcess(),TOKEN_ADJUST_PRIVILEGES|TOKEN_QUERY,&token))return false;
        NativeHandle tokenHandle(token);
        TOKEN_PRIVILEGES privileges{};
        privileges.PrivilegeCount=1;
        if(!LookupPrivilegeValueW(nullptr,SE_SHUTDOWN_NAME,&privileges.Privileges[0].Luid))return false;
        privileges.Privileges[0].Attributes=SE_PRIVILEGE_ENABLED;
        SetLastError(ERROR_SUCCESS);
        if(!AdjustTokenPrivileges(tokenHandle.get(),FALSE,&privileges,0,nullptr,nullptr))return false;
        return GetLastError()==ERROR_SUCCESS;
    }
    bool performPowerAction(bool restart){
        if(runWpeutil(restart?L"Reboot":L"Shutdown"))return true;
        enableShutdownPrivilege();
        UINT flags=(restart?EWX_REBOOT:EWX_SHUTDOWN)|EWX_FORCEIFHUNG;
        return ExitWindowsEx(flags,SHTDN_REASON_MAJOR_OTHER|SHTDN_REASON_MINOR_OTHER|SHTDN_REASON_FLAG_PLANNED)!=FALSE;
    }
    void openWindow(AppType app){
        for(auto& window:windows_)if(window.app==app){focusWindow(window.id);return;}
        static const wchar_t* titles[]={L"Files",L"Terminal",L"Metrics",L"Processes",L"Settings",L"Notes",L"Developer",L"Trusten Studio",L"Trusten Browser",L"Trusten Paint",L"Trusten Media Player",L"AI Assistant",L"Trusten Camera",L"Gallery",L"Microphone Recorder",L"Streamlined Video Editor",L"About"};
        int offset=(nextWindowId_%6)*28;
        VirtualWindow window;window.id=nextWindowId_++;window.app=app;window.title=titles[(int)app];
        window.bounds={55+offset,78+offset,std::max(430,layout_.width*2/3),std::max(310,(layout_.workspaceBottom()-90)*2/3)};
        window.z=++topZ_;windows_.push_back(window);activeWindowId_=window.id;
        if (app == AppType::Files) {
            refreshFiles();
        }
        if (app == AppType::Processes) {
            refreshProcesses();
        }
        applyWindowLayout();
        if(app==AppType::Browser) showWebApp(window.id,app);
    }
    void applyWindowLayout(){
        std::vector<VirtualWindow*> visible;
        for(auto& window:windows_)if(!window.minimized)visible.push_back(&window);
        if(visible.empty()||windowLayout_==WindowLayout::Floating)return;
        Rect area{layout_.margin,layout_.topBar,layout_.width-layout_.margin*2,layout_.workspaceBottom()-layout_.topBar-layout_.margin};
        if(windowLayout_==WindowLayout::Fullscreen){for(auto*w:visible){w->bounds=area;w->maximized=true;}return;}
        if(windowLayout_==WindowLayout::Stacked){int step=28;for(size_t i=0;i<visible.size();++i){visible[i]->maximized=false;visible[i]->bounds={area.x+(int)i*step,area.y+(int)i*step,area.width-(int)(visible.size()-1)*step,area.height-(int)(visible.size()-1)*step};}return;}
        int count=(int)visible.size();int columns=(int)std::ceil(std::sqrt((double)count));int rows=(count+columns-1)/columns;
        int gap=10,cellWidth=(area.width-gap*(columns-1))/columns,cellHeight=(area.height-gap*(rows-1))/rows;
        for(int i=0;i<count;++i){visible[i]->maximized=false;visible[i]->bounds={area.x+(i%columns)*(cellWidth+gap),area.y+(i/columns)*(cellHeight+gap),cellWidth,cellHeight};}
    }
    void startSession(){
        workspace_.open(loginName_);loadUserTheme();currentDirectory_=L"Desktop";refreshFiles();refreshProcesses();loadAddons();
        try{auto data=workspace_.read(editorPath_);editor_.set(std::wstring(data.begin(),data.end()));}catch(...){editor_.set(L"");}
        stage_=Stage::Desktop;keyboard_.visible=false;windows_.clear();openWindow(AppType::Files);recordLastUse();checkForUpdates(true);
    }
    void drawAnimatedBackdrop(Canvas& canvas){
        canvas.clear(theme_.background);
        for(int y=0;y<layout_.height;++y){
            double t=(double)y/std::max(1,layout_.height-1);
            COLORREF color=RGB((int)(6+15*t),(int)(9+8*t),(int)(22+30*t));
            canvas.line(0,y,layout_.width,y,color);
        }
        int centerX=(int)((std::sin(animationPhase_)+1)*layout_.width*.22);
        int centerY=(int)((std::cos(animationPhase_*.7)+1)*layout_.height*.16);
        for(int radius=280;radius>20;radius-=18)
            canvas.border({centerX-radius,centerY-radius,radius*2,radius*2},RGB(14+radius/8,27+radius/9,49+radius/6),radius*2);
        for(int x=0;x<layout_.width;x+=80)canvas.line(x,0,x,layout_.height,RGB(9,15,28));
        for(int y=0;y<layout_.height;y+=80)canvas.line(0,y,layout_.width,y,RGB(9,15,28));
    }
    void loadBootLogo(){
        if(bootLogo_)return;
        std::vector<std::filesystem::path> candidates;
        wchar_t system[MAX_PATH]{};GetSystemDirectoryW(system,MAX_PATH);
        candidates.push_back(std::filesystem::path(system)/L"oemlogo.bmp");
        candidates.push_back(L"X:\\Windows\\System32\\oemlogo.bmp");
        for(wchar_t drive=L'C';drive<=L'Z';++drive){
            auto root=std::wstring(1,drive)+L":\\";
            candidates.push_back(root+L"EFI\\Boot\\logo.bmp");
            candidates.push_back(root+L"EFI\\Microsoft\\Boot\\logo.bmp");
            candidates.push_back(root+L"EFI\\Boot\\splash.bmp");
        }
        for(const auto& candidate:candidates){if(std::filesystem::exists(candidate)){bootLogo_=(HBITMAP)LoadImageW(nullptr,candidate.c_str(),IMAGE_BITMAP,0,0,LR_LOADFROMFILE|LR_CREATEDIBSECTION);if(bootLogo_){bootLogoPath_=candidate.wstring();break;}}}
    }
    void drawBrandMark(Canvas& canvas,Rect box){
        if(bootLogo_){canvas.bitmap(bootLogo_,box);return;}
        canvas.rounded(box,RGB(10,22,38),box.width/3);canvas.border(box,theme_.accent,box.width/3,3);
        int cx=box.x+box.width/2,cy=box.y+box.height/2;
        canvas.line(cx-box.width/4,cy,cx,cy-box.height/4,theme_.accent,5);
        canvas.line(cx,cy-box.height/4,cx+box.width/4,cy,theme_.accentSecondary,5);
        canvas.line(cx+box.width/4,cy,cx,cy+box.height/4,theme_.accent,5);
        canvas.line(cx,cy+box.height/4,cx-box.width/4,cy,theme_.accentSecondary,5);
    }
    void drawUserIcon(Canvas& canvas,Rect box,const std::wstring& name){
        unsigned seed=2166136261u;for(wchar_t c:name)seed=(seed^(unsigned)c)*16777619u;
        COLORREF glow=RGB(70+(seed&63),130+((seed>>6)&63),180+((seed>>12)&63));
        canvas.rounded(box,RGB(15,27,47),box.width/2);canvas.border(box,glow,box.width/2,3);
        int cx=box.x+box.width/2;Rect head{cx-box.width/8,box.y+box.height/5,box.width/4,box.height/4};canvas.rounded(head,glow,head.width);
        Rect shoulders{box.x+box.width/5,box.y+box.height*53/100,box.width*3/5,box.height/3};canvas.rounded(shoulders,glow,shoulders.height);
        canvas.border({box.x+6,box.y+6,box.width-12,box.height-12},theme_.accentSecondary,box.width/2);
    }
    void loadUserTheme(){
        try {
            auto file=workspace_.root()/L"Settings"/L"theme.ini";
            std::ifstream in(file);
            std::string line;
            while(std::getline(in,line)){
                if(line.rfind("accent=",0)==0) theme_.accent=(COLORREF)std::stoul(line.substr(7));
                else if(line.rfind("radius=",0)==0) theme_.cornerRadius=std::clamp(std::stoi(line.substr(7)),8,36);
            }
        } catch(...) {}
    }
    void saveUserTheme(){
        try {
            auto file=workspace_.root()/L"Settings"/L"theme.ini";
            std::filesystem::create_directories(file.parent_path());
            std::ofstream out(file,std::ios::trunc);
            out<<"accent="<<(unsigned long)theme_.accent<<"\nradius="<<theme_.cornerRadius<<"\n";
        } catch(...) {}
    }
    void drawForgotPinPopup(Canvas& canvas){if(!forgotPinVisible_)return;int w=std::min(540,layout_.width-40);Rect panel{(layout_.width-w)/2,layout_.height/2-145,w,290};canvas.glass(panel,theme_,true);canvas.text(L"PIN RECOVERY",{panel.x+20,panel.y+16,panel.width-40,38},theme_.text,true,false,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);canvas.text(lastUseReminder(),{panel.x+26,panel.y+65,panel.width-52,34},theme_.muted,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);canvas.text(L"Choose a private reminder or reset this account's PIN.",{panel.x+25,panel.y+104,panel.width-50,42},theme_.text,false,false,false,DT_CENTER|DT_WORDBREAK);Rect remind{panel.x+28,panel.y+175,150,52},reset{panel.x+195,panel.y+175,150,52},cancel{panel.x+362,panel.y+175,150,52};canvas.gradient(remind,theme_.accentSecondary,theme_.accent);canvas.glass(reset,theme_);canvas.glass(cancel,theme_);canvas.text(L"REMIND ME",remind,RGB(4,10,18),true,false,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);canvas.text(L"RESET PIN",reset,theme_.accent,true,false,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);canvas.text(L"CANCEL",cancel,theme_.muted,true,false,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);}
    void drawStartup(Canvas& canvas){
        loadBootLogo();
        drawAnimatedBackdrop(canvas);
        int barWidth=std::min(620,layout_.width-80);
        Rect bar{(layout_.width-barWidth)/2,layout_.height/2+72,barWidth,14};
        drawBrandMark(canvas,{layout_.width/2-55,layout_.height/2-180,110,110});
        canvas.text(L"INITIALIZING GLASS DESKTOP",{0,layout_.height/2-35,layout_.width,34},theme_.text,true,false,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
        canvas.rounded(bar,RGB(20,31,51),7);
        canvas.gradient({bar.x,bar.y,(int)(bar.width*startupProgress_),bar.height},theme_.accentSecondary,theme_.accent);
        static const wchar_t* steps[]={L"Frosting interface materials",L"Starting desktop grid",L"Mounting workspace profiles",L"Starting taskbar and top bar",L"Initializing panels and custom windows"};
        int step=std::min(4,(int)(startupProgress_*5));
        canvas.text(steps[step],{0,bar.y+28,layout_.width,30},theme_.muted,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
    }
    void drawLock(Canvas& canvas){
        drawAnimatedBackdrop(canvas);SYSTEMTIME time{};GetLocalTime(&time);wchar_t clock[32];swprintf(clock,32,L"%02u:%02u",time.wHour,time.wMinute);
        canvas.text(clock,{0,layout_.height/2-120,layout_.width,90},theme_.text,false,false,true,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
        canvas.text(L"TRUSTEN OS",{0,layout_.height/2-22,layout_.width,46},theme_.accent,true,false,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
        canvas.text(L"Click or press Enter",{0,layout_.height/2+38,layout_.width,30},theme_.muted,false,false,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
    }
    void drawLogin(Canvas& canvas){
        drawAnimatedBackdrop(canvas);int width=std::min(560,layout_.width-32),height=500;Rect card{(layout_.width-width)/2,(layout_.height-height)/2,width,height};canvas.glass(card,theme_,true);
        Rect avatar{card.x+card.width/2-66,card.y+34,132,132};drawUserIcon(canvas,avatar,loginName_);
        canvas.text(loginName_.empty()?L"Guest":loginName_,{card.x+25,card.y+176,card.width-50,40},theme_.text,true,false,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
        canvas.text(L"Personal workspace and theme",{card.x+25,card.y+213,card.width-50,26},theme_.muted,false,false,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
        Rect pin{card.x+62,card.y+258,card.width-124,54};canvas.rounded(pin,theme_.raised,15);canvas.border(pin,theme_.accent,15,2);canvas.text(std::wstring(loginPin_.size(),L'*')+L"_",{pin.x+16,pin.y,pin.width-32,pin.height},theme_.text,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
        Rect login{card.x+62,card.y+330,card.width-124,54};canvas.gradient(login,theme_.accentSecondary,theme_.accent);canvas.text(L"LOGIN",login,RGB(4,10,18),true,false,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
        Rect forgot{card.x+card.width/2-110,card.y+398,220,34};canvas.text(L"FORGOT PIN",forgot,theme_.accent,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
        int listWidth=190;Rect users{18,std::max(70,layout_.height/2-190),listWidth,380};canvas.glass(users,theme_,true);canvas.text(L"USERS",{users.x+12,users.y+10,users.width-24,32},theme_.accent,true,false,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);int uy=users.y+54;for(size_t i=0;i<knownUsers_.size()&&i<8;++i){Rect item{users.x+10,uy,users.width-20,40};canvas.glass(item,theme_,knownUsers_[i]==loginName_);canvas.text(knownUsers_[i],item,theme_.text,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);uy+=46;}Rect add{users.x+10,users.y+users.height-52,users.width-20,40};canvas.glass(add,theme_);canvas.text(L"+ NEW USER",add,theme_.accent,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);keyboard_.draw(canvas,layout_.keyboardRect(),theme_);if(accountModal_)drawAccountModal(canvas);drawForgotPinPopup(canvas);
    }
    void drawTopBar(Canvas& canvas){
        Rect start{16,9,136,40};canvas.glass(start,theme_,launcherVisible_);canvas.text(L"TRUSTEN",start,theme_.accent,true,false,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
        canvas.text(layout_.name()+L" EXPERIENCE",{164,11,220,35},theme_.accentSecondary,false,true);
        std::wstring rights=permissions_.administrator?L"ADMIN":L"STANDARD";
        canvas.text(rights,{layout_.width-330,10,100,36},permissions_.administrator?theme_.accent:theme_.muted,false,true,false,DT_RIGHT|DT_VCENTER|DT_SINGLELINE);
        Rect bell{layout_.width-274,9,58,38},key{layout_.width-208,9,58,38},lock{layout_.width-142,9,58,38},power{layout_.width-76,9,58,38};
        canvas.rounded(bell,notificationCenterVisible_?theme_.accentSecondary:theme_.raised,11);canvas.rounded(key,keyboard_.visible?theme_.accentSecondary:theme_.raised,11);canvas.rounded(lock,theme_.raised,11);canvas.rounded(power,RGB(74,34,48),11);
        canvas.text(L"NOTE",bell,theme_.accent,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
        canvas.text(L"KEY",key,theme_.text,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
        canvas.text(L"LOCK",lock,theme_.accent,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
        canvas.text(L"POWER",power,COLOR_DANGER,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
    }
    void drawDock(Canvas& canvas){
        Rect dock=layout_.dockRect();canvas.gradient(dock,RGB(13,21,36),RGB(7,12,23));
        static const std::array<std::pair<AppType,const wchar_t*>,13> apps{{
            {AppType::Files,L"FILES"},{AppType::Terminal,L"TERM"},{AppType::Monitor,L"METER"},{AppType::Processes,L"TASKS"},
            {AppType::Settings,L"SET"},{AppType::Notes,L"NOTES"},{AppType::Developer,L"DEV"},{AppType::Studio,L"STUDIO"},
            {AppType::Browser,L"WEB"},{AppType::Paint,L"PAINT"},{AppType::Media,L"MEDIA"},{AppType::Assistant,L"AI"},{AppType::About,L"INFO"}}};
        int gap=3,width=std::max(42,(dock.width-layout_.margin*2-gap*12)/13),x=layout_.margin;
        for(const auto& app:apps){bool running=false;for(const auto& window:windows_)if(window.app==app.first)running=true;Rect item{x,dock.y+9,width,dock.height-18};canvas.glass(item,theme_,running);canvas.text(app.second,item,running?theme_.accent:theme_.muted,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);x+=width+gap;}
    }
    void drawLauncher(Canvas& canvas){
        int width=layout_.device==DeviceClass::Phone?layout_.width-24:std::min(620,layout_.width-40);
        Rect panel{16,58,width,std::min(470,layout_.workspaceBottom()-80)};
        canvas.glass(panel,theme_,true);canvas.text(L"FAST LAUNCHER",{panel.x+18,panel.y+12,panel.width-36,38},theme_.text,true);
        canvas.text(L"Apps, commands, files and workspaces",{panel.x+18,panel.y+48,panel.width-36,25},theme_.muted);
        static const wchar_t* names[]={L"FILES",L"TERMINAL",L"METRICS",L"PROCESSES",L"SETTINGS",L"NOTES",L"DEVELOPER",L"STUDIO",L"BROWSER",L"PAINT",L"MEDIA",L"AI",L"ABOUT"};
        int columns=layout_.device==DeviceClass::Phone?2:4,gap=10,tileWidth=(panel.width-36-gap*(columns-1))/columns;
        for(int i=0;i<13;++i){int row=i/columns,column=i%columns;Rect tile{panel.x+18+column*(tileWidth+gap),panel.y+86+row*70,tileWidth,58};canvas.glass(tile,theme_);canvas.text(names[i],tile,theme_.accent,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);}
        canvas.text(L"F1 launcher  F2 keyboard  Ctrl+L lock  Alt+1..8 apps",{panel.x+18,panel.y+panel.height-40,panel.width-36,25},theme_.muted,false,true);
    }
    void drawShutdownPrompt(Canvas& canvas){
        for(int y=0;y<layout_.height;y+=3)canvas.line(0,y,layout_.width,y,RGB(3,5,10),2);
        int width=std::min(620,layout_.width-40);Rect panel{(layout_.width-width)/2,layout_.height/2-135,width,270};
        canvas.glass(panel,theme_,true);canvas.text(L"Power options",{panel.x+24,panel.y+24,panel.width-48,42},theme_.text,true,false,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
        canvas.text(L"Choose an action for Trusten OS and this computer.",{panel.x+24,panel.y+78,panel.width-48,30},theme_.muted,false,false,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
        int gap=14,buttonWidth=(panel.width-80-gap*2)/3;
        Rect shutdown{panel.x+40,panel.y+165,buttonWidth,54};
        Rect restart{shutdown.x+buttonWidth+gap,panel.y+165,buttonWidth,54};
        Rect cancel{restart.x+buttonWidth+gap,panel.y+165,buttonWidth,54};
        canvas.gradient(shutdown,RGB(95,232,255),RGB(83,153,255));
        canvas.gradient(restart,theme_.accentSecondary,theme_.accent);
        canvas.rounded(cancel,theme_.raised,14);
        canvas.text(L"SHUT DOWN",shutdown,RGB(4,10,18),true,false,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
        canvas.text(L"RESTART",restart,RGB(4,10,18),true,false,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
        canvas.text(L"CANCEL",cancel,theme_.text,true,false,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
    }
    void drawWindow(Canvas& canvas,VirtualWindow& window){
        Rect base=actualBounds(window);float scale=.88f+.12f*window.openProgress;
        int centerX=base.x+base.width/2,centerY=base.y+base.height/2;
        Rect box{centerX-(int)(base.width*scale/2),centerY-(int)(base.height*scale/2),(int)(base.width*scale),(int)(base.height*scale)};
        bool focused=window.id==activeWindowId_;canvas.glass(box,theme_,focused);
        if(focused){canvas.line(box.x,box.y+24,box.x,box.y+box.height-24,theme_.accent,2);canvas.line(box.x+box.width-1,box.y+24,box.x+box.width-1,box.y+box.height-24,theme_.accentSecondary,2);}
        canvas.gradient({box.x,box.y,box.width,WINDOW_TITLE_HEIGHT},focused?RGB(34,77,98):RGB(29,42,65),focused?RGB(21,50,70):RGB(20,31,49));
        canvas.text(window.title,{box.x+14,box.y,box.width-150,WINDOW_TITLE_HEIGHT},theme_.text,true);
        Rect minimize{box.x+box.width-126,box.y+7,34,28},maximize{box.x+box.width-86,box.y+7,34,28},close{box.x+box.width-46,box.y+7,34,28};
        canvas.rounded(minimize,theme_.raised,8);canvas.rounded(maximize,theme_.raised,8);canvas.rounded(close,RGB(76,34,48),8);
        canvas.text(L"_",minimize,theme_.muted,true,false,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
        canvas.text(L"[]",maximize,theme_.accent,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
        canvas.text(L"X",close,COLOR_DANGER,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
        Rect content{box.x+12,box.y+WINDOW_TITLE_HEIGHT+8,box.width-24,box.height-WINDOW_TITLE_HEIGHT-20};
        drawApp(canvas,window.app,content);
    }
    void graph(Canvas& canvas,Rect box,const std::deque<double>& values,COLORREF color){
        canvas.border(box,RGB(67,88,113),12);if(values.size()<2)return;double step=(double)(box.width-12)/179;
        for(size_t i=1;i<values.size();++i){int x1=box.x+6+(int)((i-1)*step),x2=box.x+6+(int)(i*step);int y1=box.y+box.height-6-(int)(values[i-1]*(box.height-12)/100),y2=box.y+box.height-6-(int)(values[i]*(box.height-12)/100);canvas.line(x1,y1,x2,y2,color,2);}
    }
    void drawApp(Canvas& canvas,AppType app,Rect content){
        if(app==AppType::Files){Rect back{content.x,content.y,44,34},forward{content.x+49,content.y,44,34},up{content.x+98,content.y,44,34},address{content.x+148,content.y,content.width-420,34},newText{content.x+content.width-266,content.y,78,34},newFolder{content.x+content.width-183,content.y,84,34},refresh{content.x+content.width-94,content.y,94,34};for(auto r:{back,forward,up,newText,newFolder,refresh})canvas.glass(r,theme_);canvas.text(L"<",back,theme_.accent,true,false,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);canvas.text(L">",forward,theme_.accent,true,false,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);canvas.text(L"UP",up,theme_.accent,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);canvas.rounded(address,theme_.raised,10);canvas.border(address,theme_.accentSecondary,10);canvas.text(addressBar_+L"_",{address.x+10,address.y,address.width-20,address.height},theme_.text,false,true);canvas.text(L"NEW TXT",newText,theme_.text,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);canvas.text(L"NEW DIR",newFolder,theme_.text,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);canvas.text(L"REFRESH",refresh,theme_.text,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);int side=150,previewWidth=std::max(190,content.width/3);canvas.glass({content.x,content.y+44,side,content.height-44},theme_);canvas.text(L"PINNED",{content.x+10,content.y+52,side-20,24},theme_.accent,false,true);int py=content.y+82;for(auto&pin:pinnedDirs_){canvas.text(pin,{content.x+12,py,side-24,29},theme_.text,false,true);py+=32;}Rect preview{content.x+content.width-previewWidth,content.y+44,previewWidth,content.height-44};canvas.glass(preview,theme_,selectedFileIndex_>=0);canvas.text(L"PREVIEW",{preview.x+12,preview.y+8,preview.width-24,26},theme_.accent,false,true);std::wistringstream previewLines(filePreviewText_);std::wstring previewLine;int previewY=preview.y+38;while(std::getline(previewLines,previewLine)&&previewY+19<preview.y+preview.height){canvas.text(previewLine,{preview.x+12,previewY,preview.width-24,19},theme_.text,false,true);previewY+=19;}int listX=content.x+side+10,listWidth=content.width-side-previewWidth-20,y=content.y+48;canvas.text(L"NAME",{listX,y,listWidth-170,24},theme_.muted,false,true);canvas.text(L"TYPE / SIZE",{listX+listWidth-165,y,160,24},theme_.muted,false,true,false,DT_RIGHT|DT_VCENTER|DT_SINGLELINE);y+=26;for(size_t i=0;i<files_.size()&&y+32<content.y+content.height;++i){Rect row{listX,y,listWidth,30};if((int)i==selectedFileIndex_)canvas.glass(row,theme_,true);canvas.text((files_[i].is_directory()?L"[DIR] ":L"[FILE] ")+files_[i].path().filename().wstring(),{row.x+6,row.y,row.width-176,row.height},files_[i].is_directory()?theme_.accent:theme_.text,false,true);std::wstring details=L"Folder";if(!files_[i].is_directory()){std::error_code ec;auto bytes=files_[i].file_size(ec);details=files_[i].path().extension().wstring()+L"  "+(ec?L"?":std::to_wstring(bytes)+L" B");}canvas.text(details,{row.x+row.width-168,row.y,160,row.height},theme_.muted,false,true,false,DT_RIGHT|DT_VCENTER|DT_SINGLELINE);y+=33;}}
        else if(app==AppType::Terminal){int max=std::max(1,(content.height-40)/19),first=std::max(0,(int)terminal_.size()-max),y=content.y;for(int i=first;i<(int)terminal_.size();++i){canvas.text(terminal_[i],{content.x,y,content.width,19},theme_.text,false,true);y+=19;}canvas.line(content.x,content.y+content.height-33,content.x+content.width,content.y+content.height-33,theme_.accentSecondary);canvas.text(L"> "+terminalInput_+L"_",{content.x,content.y+content.height-30,content.width,28},theme_.accent,false,true);}
        else if(app==AppType::Monitor){int half=(content.height-44)/2;canvas.text(L"CPU "+std::to_wstring((int)metrics_.cpu)+L"%",{content.x,content.y,content.width,22},theme_.accent,false,true);graph(canvas,{content.x,content.y+24,content.width,half},metrics_.cpuHistory,theme_.accent);canvas.text(L"RAM "+std::to_wstring(metrics_.memory)+L"%",{content.x,content.y+half+5,content.width,22},theme_.accentSecondary,false,true);graph(canvas,{content.x,content.y+half+29,content.width,half},metrics_.memoryHistory,theme_.accentSecondary);}
        else if(app==AppType::Processes){canvas.text(permissions_.processControl?L"Right-click a task for End task or Restart task":L"Read-only process view",{content.x,content.y,content.width,26},permissions_.processControl?theme_.accent:theme_.muted);int y=content.y+43;for(size_t i=0;i<processes_.size()&&y+27<content.y+content.height;++i){canvas.text(processes_[i].name,{content.x+8,y,content.width-170,27},theme_.text,false,true);canvas.text(L"PID "+std::to_wstring(processes_[i].pid),{content.x+content.width-155,y,145,27},theme_.muted,false,true,false,DT_RIGHT|DT_VCENTER|DT_SINGLELINE);y+=29;}if(taskMenuVisible_){Rect menu{taskMenuPoint_.x,taskMenuPoint_.y,180,94};canvas.glass(menu,theme_,true);canvas.text(L"End task",{menu.x+12,menu.y+8,menu.width-24,36},COLOR_DANGER);canvas.text(L"Restart task",{menu.x+12,menu.y+48,menu.width-24,36},theme_.text);}}
        else if(app==AppType::Settings){std::array<const wchar_t*,3> tabs{L"PERSONALIZE",L"SYSTEM",L"UPDATES"};int gap=8,tw=(content.width-gap*2)/3;for(int i=0;i<3;++i){Rect tab{content.x+i*(tw+gap),content.y,tw,40};canvas.glass(tab,theme_,settingsTab_==i);canvas.text(tabs[i],tab,settingsTab_==i?theme_.accent:theme_.muted,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);}int y=content.y+50;if(settingsTab_==0){std::array<std::pair<std::wstring,std::wstring>,4> rows{{{L"Touch keyboard",keyboard_.visible?L"ON":L"OFF"},{L"High contrast",theme_.highContrast?L"ON":L"OFF"},{L"Corner radius",std::to_wstring(theme_.cornerRadius)},{L"Panel density",theme_.density==0?L"COMPACT":theme_.density==1?L"COMFORT":L"SPACIOUS"}}};for(auto&r:rows){Rect p{content.x,y,content.width,44};canvas.glass(p,theme_);canvas.text(r.first,{p.x+12,p.y,p.width-180,p.height},theme_.text);canvas.text(r.second,{p.x+p.width-170,p.y,158,p.height},theme_.muted,false,true,false,DT_RIGHT|DT_VCENTER|DT_SINGLELINE);y+=49;}canvas.text(L"ACCENT COLOR",{content.x,y,180,30},theme_.text,false,true);std::array<COLORREF,8> colors{RGB(82,228,255),RGB(177,136,255),RGB(255,105,180),RGB(255,112,112),RGB(255,184,76),RGB(112,232,145),RGB(85,160,255),RGB(238,238,238)};int swatchW=std::max(34,(content.width-14*7)/8);for(int i=0;i<8;++i){Rect swatch{content.x+i*(swatchW+14),y+36,swatchW,44};canvas.rounded(swatch,colors[i],12);canvas.border(swatch,theme_.accent==colors[i]?theme_.text:RGB(80,95,116),12,theme_.accent==colors[i]?3:1);}}else if(settingsTab_==1){std::array<std::pair<std::wstring,std::wstring>,5> rows{{{L"Window layout",windowLayout_==WindowLayout::Floating?L"FLOAT":windowLayout_==WindowLayout::Tiled?L"TILE":windowLayout_==WindowLayout::Stacked?L"STACK":L"FULL"},{L"Data root",workspace_.root().wstring()},{L"Change username/PIN",workspace_.user()},{L"Save pinned dirs",L"SAVE"},{L"Save settings",settingsStatus_}}};for(auto&r:rows){Rect p{content.x,y,content.width,44};canvas.glass(p,theme_);canvas.text(r.first,{p.x+12,p.y,p.width-180,p.height},theme_.text);canvas.text(r.second,{p.x+p.width-170,p.y,158,p.height},theme_.muted,false,true,false,DT_RIGHT|DT_VCENTER|DT_SINGLELINE);y+=49;}}else{Rect check{content.x,y,content.width,54};canvas.glass(check,theme_,updateAvailable_);canvas.text(L"CHECK FOR UPDATES",{check.x+14,check.y,check.width-190,check.height},theme_.text,true);canvas.text(updateStatus_,{check.x+check.width-176,check.y,162,check.height},updateAvailable_?COLOR_DANGER:theme_.accent,false,true,false,DT_RIGHT|DT_VCENTER|DT_SINGLELINE);canvas.text(L"Current EXE SHA-256: "+(currentExeHash_.empty()?L"Not checked":currentExeHash_),{content.x,y+68,content.width,24},theme_.muted,false,true);canvas.text(L"Latest ISO archive hash: "+(remoteIsoHash_.empty()?L"Not checked":remoteIsoHash_),{content.x,y+98,content.width,24},theme_.muted,false,true);canvas.text(L"Updates are detected quickly from Archive metadata without downloading the full ISO.",{content.x,y+135,content.width,52},theme_.text,false,false,false,DT_LEFT|DT_WORDBREAK);}}
        else if(app==AppType::Notes){
            Rect saveButton{content.x,content.y,86,32},saveAsButton{content.x+94,content.y,112,32};
            canvas.glass(saveButton,theme_);canvas.glass(saveAsButton,theme_);
            canvas.text(L"SAVE",saveButton,theme_.accent,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
            canvas.text(L"SAVE AS...",saveAsButton,theme_.accentSecondary,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
            canvas.text(editorPath_+L"  "+notesStatus_,{content.x+218,content.y,content.width-218,32},theme_.muted,false,true);
            const auto& value=editor_.text();
            int total=notesLineCount(), visible=std::max(1,(content.height-58)/19);
            int maxColumns=notesMaxColumns(), visibleColumns=std::max(1,(content.width-24)/9);
            notesScrollLine_=std::clamp(notesScrollLine_,0,std::max(0,total-visible));
            notesScrollColumn_=std::clamp(notesScrollColumn_,0,std::max(0,maxColumns-visibleColumns));
            size_t lineStart=0;
            for(int skip=0;skip<notesScrollLine_&&lineStart<value.size();++skip){size_t n=value.find(L'\n',lineStart);lineStart=n==std::wstring::npos?value.size():n+1;}
            int y=content.y+29;
            while(lineStart<=value.size()&&y+19<content.y+content.height){
                size_t lineEnd=value.find(L'\n',lineStart);if(lineEnd==std::wstring::npos)lineEnd=value.size();
                std::wstring fullLine=value.substr(lineStart,lineEnd-lineStart);
                std::wstring line=notesScrollColumn_<(int)fullLine.size()?fullLine.substr((size_t)notesScrollColumn_,(size_t)visibleColumns):L"";
                canvas.text(line,{content.x,y,content.width-18,19},theme_.text,false,true);
                if(editor_.caret()>=lineStart&&editor_.caret()<=lineEnd&&((GetTickCount64()/500)%2)==0){
                    size_t caretColumn=editor_.caret()-lineStart;size_t visibleStart=(size_t)notesScrollColumn_;std::wstring before=caretColumn>visibleStart?value.substr(lineStart+visibleStart,caretColumn-visibleStart):L"";SIZE extent{};HDC measure=GetDC(hwnd_);HFONT font=CreateFontW(-16,0,0,0,FW_NORMAL,FALSE,FALSE,FALSE,DEFAULT_CHARSET,0,0,CLEARTYPE_QUALITY,FIXED_PITCH,L"Consolas");HGDIOBJ oldFont=SelectObject(measure,font);GetTextExtentPoint32W(measure,before.c_str(),(int)before.size(),&extent);SelectObject(measure,oldFont);DeleteObject(font);ReleaseDC(hwnd_,measure);canvas.line(content.x+extent.cx,y+2,content.x+extent.cx,y+17,theme_.accent,2);
                }
                if (lineEnd == value.size()) {
                    break;
                }
                lineStart = lineEnd + 1;
                y += 19;
            }
            Rect track{content.x+content.width-12,content.y+43,8,content.height-61};canvas.rounded(track,RGB(16,25,42),4);
            if(total>visible){int thumbH=std::max(24,track.height*visible/total);int range=track.height-thumbH;int maxScroll=std::max(1,total-visible);int thumbY=track.y+range*notesScrollLine_/maxScroll;canvas.rounded({track.x,thumbY,track.width,thumbH},theme_.accent,4);}
            Rect horizontalTrack{content.x,content.y+content.height-12,content.width-16,8};canvas.rounded(horizontalTrack,RGB(16,25,42),4);
            if(maxColumns>visibleColumns){int thumbW=std::max(30,horizontalTrack.width*visibleColumns/maxColumns);int range=horizontalTrack.width-thumbW;int maxScroll=std::max(1,maxColumns-visibleColumns);int thumbX=horizontalTrack.x+range*notesScrollColumn_/maxScroll;canvas.rounded({thumbX,horizontalTrack.y,thumbW,horizontalTrack.height},theme_.accentSecondary,4);}
        }
        else if(app==AppType::Developer){canvas.text(L"DEVELOPER COMMAND CENTER",{content.x,content.y,content.width,38},theme_.accent,true);std::array<std::pair<const wchar_t*,const wchar_t*>,6> cards{{{L"TERMINAL",L"Commands and automation"},{L"PROJECTS",L"Persistent workspaces"},{L"METRICS",L"Live CPU and memory"},{L"PROCESSES",L"Permission-aware inspection"},{L"WINDOWS",L"Float, tile, stack, fullscreen"},{L"SHORTCUTS",L"F1 launcher, F2 keyboard"}}};int columns=layout_.device==DeviceClass::Phone?1:2,width=(content.width-12*(columns-1))/columns;for(int i=0;i<6;++i){int row=i/columns,column=i%columns;Rect card{content.x+column*(width+12),content.y+48+row*84,width,72};canvas.glass(card,theme_);canvas.text(cards[i].first,{card.x+12,card.y+6,card.width-24,24},theme_.accentSecondary,false,true);canvas.text(cards[i].second,{card.x+12,card.y+29,card.width-24,34},theme_.text);}}
        else if(app==AppType::Studio){
            Rect left=studioAiVisible_?Rect{content.x,content.y,std::max(250,content.width-398),content.height}:content;
            drawStudio(canvas,left);
            if(studioAiVisible_) drawNativeAi(canvas,{content.x+content.width-390,content.y,390,content.height},true);
        }
        else if(app==AppType::Assistant){
            drawNativeAi(canvas,content,false);
        }
        else if(app==AppType::Paint){
            canvas.text(L"TRUSTEN PAINT",{content.x,content.y,content.width-130,36},theme_.accent,true);
            Rect import{content.x+content.width-126,content.y,126,36};canvas.glass(import,theme_,true);canvas.text(L"OPEN IMAGE",import,theme_.accent,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
            Rect tools{content.x,content.y+44,120,content.height-44};canvas.glass(tools,theme_,true);
            std::array<const wchar_t*,5> labels{L"PENCIL",L"BRUSH",L"ERASER",L"CLEAR",L"SAVE"};int ty=tools.y+10;for(auto label:labels){Rect b{tools.x+8,ty,tools.width-16,39};canvas.glass(b,theme_);canvas.text(label,b,theme_.accent,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);ty+=46;}
            Rect board{content.x+132,content.y+44,content.width-132,content.height-44};canvas.rounded(board,RGB(244,247,252),12);canvas.border(board,theme_.accentSecondary,12,2);
            if(paintBitmap_)canvas.bitmap(paintBitmap_,{board.x+4,board.y+4,board.width-8,board.height-8});else canvas.text(L"Open a BMP image or draw on the native canvas",{board.x+20,board.y+board.height/2-24,board.width-40,48},RGB(55,68,84),false,false,false,DT_CENTER|DT_VCENTER|DT_WORDBREAK);
        }
        else if(app==AppType::Media){
            canvas.text(L"TRUSTEN MEDIA PLAYER",{content.x,content.y,content.width-150,36},theme_.accent,true);
            Rect import{content.x+content.width-146,content.y,146,36};canvas.glass(import,theme_,true);canvas.text(L"OPEN MEDIA",import,theme_.accent,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
            Rect display{content.x,content.y+44,content.width,content.height-112};canvas.glass(display,theme_,true);std::wstring name=mediaPath_.empty()?L"Choose a media file":std::filesystem::path(mediaPath_).filename().wstring();canvas.text(name,{display.x+20,display.y+display.height/2-25,display.width-40,50},theme_.text,true,false,false,DT_CENTER|DT_VCENTER|DT_WORDBREAK);
            Rect previous{content.x,content.y+content.height-56,92,44},play{content.x+102,content.y+content.height-56,112,44},stop{content.x+224,content.y+content.height-56,92,44};for(auto b:{previous,play,stop})canvas.glass(b,theme_);canvas.text(L"RESTART",previous,theme_.muted,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);canvas.text(mediaPlaying_?L"PAUSE":L"PLAY",play,theme_.accent,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);canvas.text(L"STOP",stop,COLOR_DANGER,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
        }
        else if(app==AppType::Camera){
            canvas.text(L"TRUSTEN CAMERA",{content.x,content.y,content.width,38},theme_.accent,true);
            Rect preview{content.x,content.y+48,content.width,content.height-112};canvas.glass(preview,theme_,true);
            canvas.text(cameraStatus_,{preview.x+20,preview.y+preview.height/2-30,preview.width-40,60},theme_.text,false,false,false,DT_CENTER|DT_VCENTER|DT_WORDBREAK);
            Rect photo{content.x,content.y+content.height-54,150,44},video{content.x+160,content.y+content.height-54,170,44},gallery{content.x+340,content.y+content.height-54,150,44};
            for(auto b:{photo,video,gallery})canvas.glass(b,theme_);canvas.text(L"TAKE PHOTO",photo,theme_.accent,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);canvas.text(L"RECORD VIDEO",video,COLOR_DANGER,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);canvas.text(L"OPEN GALLERY",gallery,theme_.accentSecondary,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
        }
        else if(app==AppType::Gallery){
            canvas.text(L"TRUSTEN GALLERY",{content.x,content.y,content.width,38},theme_.accent,true);
            canvas.text(L"Pictures\\Camera and Videos\\Exports",{content.x,content.y+38,content.width,28},theme_.muted,false,true);
            int gap=12,cols=3,tile=(content.width-gap*(cols-1))/cols;for(int i=0;i<9;++i){int row=i/cols,col=i%cols;Rect card{content.x+col*(tile+gap),content.y+78+row*92,tile,80};canvas.glass(card,theme_);canvas.text(L"MEDIA "+std::to_wstring(i+1),card,theme_.text,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);}
        }
        else if(app==AppType::Recorder){
            canvas.text(L"MICROPHONE RECORDER",{content.x,content.y,content.width,38},theme_.accent,true);Rect meter{content.x,content.y+58,content.width,90};canvas.glass(meter,theme_,true);for(int i=0;i<24;++i){int h=12+(i*17)%62;canvas.line(meter.x+14+i*(meter.width-28)/24,meter.y+meter.height/2-h/2,meter.x+14+i*(meter.width-28)/24,meter.y+meter.height/2+h/2,theme_.accent,3);}canvas.text(recorderStatus_,{content.x,content.y+164,content.width,44},theme_.text,false,false,false,DT_CENTER|DT_VCENTER|DT_WORDBREAK);Rect record{content.x+content.width/2-90,content.y+230,180,58};canvas.gradient(record,RGB(255,112,144),RGB(180,45,82));canvas.text(L"START RECORDING",record,RGB(255,255,255),true,false,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
        }
        else if(app==AppType::VideoEditor){
            canvas.text(L"STREAMLINED VIDEO EDITOR",{content.x,content.y,content.width,38},theme_.accent,true);Rect tools{content.x,content.y+48,150,content.height-48};canvas.glass(tools,theme_,true);std::array<const wchar_t*,8> names{L"IMPORT",L"TRIM",L"SPLIT",L"TEXT",L"AUDIO",L"COLOR",L"TRANSITION",L"EXPORT MP4"};int y=tools.y+10;for(int i=0;i<8;++i){Rect b{tools.x+8,y,tools.width-16,36};canvas.glass(b,theme_,editorTool_==i);canvas.text(names[i],b,editorTool_==i?theme_.accent:theme_.text,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);y+=42;}Rect monitor{content.x+162,content.y+48,content.width-162,content.height-150};canvas.glass(monitor,theme_,true);canvas.text(editorStatus_,{monitor.x+20,monitor.y+monitor.height/2-30,monitor.width-40,60},theme_.text,false,false,false,DT_CENTER|DT_VCENTER|DT_WORDBREAK);Rect timeline{content.x+162,content.y+content.height-90,content.width-162,90};canvas.glass(timeline,theme_);canvas.text(L"VIDEO 1     AUDIO 1     TITLES     EFFECTS",{timeline.x+14,timeline.y+8,timeline.width-28,26},theme_.muted,false,true);canvas.line(timeline.x+20,timeline.y+52,timeline.x+timeline.width-20,timeline.y+52,theme_.accentSecondary,4);
        }
        else if(app==AppType::Browser){
            Rect nav{content.x,content.y,content.width,42};canvas.glass(nav,theme_,true);
            Rect back{nav.x+6,nav.y+5,42,32},forward{nav.x+53,nav.y+5,42,32};
            canvas.glass(back,theme_);canvas.glass(forward,theme_);
            canvas.text(L"<",back,theme_.accent,true,false,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
            canvas.text(L">",forward,theme_.accent,true,false,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
            Rect address{nav.x+101,nav.y+5,nav.width-175,32};canvas.rounded(address,theme_.raised,9);canvas.border(address,theme_.accentSecondary,9);
            canvas.text(browserAddress_,{address.x+9,address.y,address.width-18,address.height},theme_.text,false,true);
            Rect go{nav.x+nav.width-68,nav.y+5,62,32};canvas.gradient(go,theme_.accentSecondary,theme_.accent);canvas.text(L"GO",go,RGB(4,10,18),true,false,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
            Rect page{content.x,content.y+50,content.width,content.height-50};canvas.glass(page,theme_,true);
            canvas.text(webViewReady_?L"WebView2 page content":webViewStatus_,{page.x+20,page.y+page.height/2-25,page.width-40,50},theme_.text,false,false,false,DT_CENTER|DT_VCENTER|DT_WORDBREAK);
        }
else {canvas.text(L"TRUSTEN OS GLASS DESKTOP",{content.x,content.y,content.width,42},theme_.accent,true);std::array<const wchar_t*,8> lines{L"Layered simulated frosted glass",L"Animated gradient grid wallpaper",L"Internal floating window manager",L"Phone, tablet and desktop layouts",L"Fast launcher and keyboard shortcuts",L"Persistent-drive workspace with X: fallback",L"Permission-aware operations",L"Single clean C++17 implementation"};int y=content.y+50;for(auto line:lines){canvas.text(line,{content.x+8,y,content.width-16,29},theme_.text);y+=33;}}
    }
    std::filesystem::path chooseSettingsRoot(){std::vector<wchar_t> order{L'X',L'C',L'D'};for(wchar_t d=L'E';d<=L'Z';++d)order.push_back(d);for(wchar_t drive:order){std::wstring root=std::wstring(1,drive)+L":\\Trusten\\Settings";UINT type=GetDriveTypeW((std::wstring(1,drive)+L":\\").c_str());if(type!=DRIVE_FIXED&&type!=DRIVE_REMOVABLE&&type!=DRIVE_RAMDISK)continue;std::error_code ec;std::filesystem::create_directories(root,ec);std::ofstream test(std::filesystem::path(root)/L".write");if(test){test<<"ok";test.close();std::filesystem::remove(std::filesystem::path(root)/L".write",ec);return root;}}return workspace_.root()/L"Settings";}
    void saveSettings(){try{auto root=chooseSettingsRoot();std::filesystem::create_directories(root);std::ofstream out(root/L"trusten-settings.ini",std::ios::trunc);out<<"glassOpacity="<<theme_.glassOpacity<<"\ncornerRadius="<<theme_.cornerRadius<<"\ndensity="<<theme_.density<<"\nhighContrast="<<(theme_.highContrast?1:0)<<"\nlayout="<<(int)windowLayout_<<"\n";if(!out)throw std::runtime_error("save");settingsStatus_=L"Saved to "+root.wstring();}catch(...){settingsStatus_=L"Save failed";}}
    void endTask(int index){if(index<0||index>=(int)processes_.size())return;DWORD pid=processes_[index].pid;if(pid==GetCurrentProcessId()){showUnavailable(L"Ending Trusten OS");return;}NativeHandle process(OpenProcess(PROCESS_TERMINATE,FALSE,pid));if(!process.valid()||!TerminateProcess(process.get(),1)){showUnavailable(L"End task");return;}terminal_.push_back(L"Ended PID "+std::to_wstring(pid));refreshProcesses();}
    void restartTask(int index){if(index<0||index>=(int)processes_.size())return;DWORD pid=processes_[index].pid;NativeHandle process(OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION|PROCESS_TERMINATE,FALSE,pid));if(!process.valid()){showUnavailable(L"Restart task");return;}wchar_t path[32768]{};DWORD size=32768;if(!QueryFullProcessImageNameW(process.get(),0,path,&size)){showUnavailable(L"Restart task");return;}if(!TerminateProcess(process.get(),0)){showUnavailable(L"Restart task");return;}STARTUPINFOW si{};si.cb=sizeof(si);PROCESS_INFORMATION pi{};std::vector<wchar_t> command(path,path+size);command.push_back(0);if(CreateProcessW(nullptr,command.data(),nullptr,nullptr,FALSE,0,nullptr,nullptr,&si,&pi)){CloseHandle(pi.hThread);CloseHandle(pi.hProcess);terminal_.push_back(L"Restarted "+std::wstring(path));}else terminal_.push_back(L"Restart launch failed");refreshProcesses();}
    void taskContext(Point p){if(stage_!=Stage::Desktop)return;taskMenuVisible_=false;taskMenuIndex_=-1;std::vector<VirtualWindow*> ordered;for(auto&window:windows_)if(!window.minimized)ordered.push_back(&window);std::sort(ordered.begin(),ordered.end(),[](auto*a,auto*b){return a->z>b->z;});for(auto*window:ordered){Rect box=actualBounds(*window);if(window->app==AppType::Processes&&box.contains(p)){Rect content{box.x+12,box.y+WINDOW_TITLE_HEIGHT+8,box.width-24,box.height-WINDOW_TITLE_HEIGHT-20};int row=(p.y-(content.y+29))/29;if(row>=0&&row<(int)processes_.size()){focusWindow(window->id);taskMenuVisible_=true;taskMenuIndex_=row;taskMenuPoint_={std::clamp(p.x,0,layout_.width-185),std::clamp(p.y,layout_.topBar,layout_.workspaceBottom()-100)};repaint();}return;}}}
    bool activateTaskMenu(Point p){if(!taskMenuVisible_)return false;Rect menu{taskMenuPoint_.x,taskMenuPoint_.y,180,94};if(!menu.contains(p)){taskMenuVisible_=false;return false;}int action=(p.y-menu.y-8)/40;if(action==0)endTask(taskMenuIndex_);else if(action==1)restartTask(taskMenuIndex_);taskMenuVisible_=false;repaint();return true;}
    std::wstring runCaptured(std::wstring command,const std::filesystem::path& cwd,DWORD& exitCode){SECURITY_ATTRIBUTES sa{sizeof(sa),nullptr,TRUE};HANDLE readPipe=nullptr,writePipe=nullptr;if(!CreatePipe(&readPipe,&writePipe,&sa,0))return L"CreatePipe failed";SetHandleInformation(readPipe,HANDLE_FLAG_INHERIT,0);STARTUPINFOW si{};si.cb=sizeof(si);si.dwFlags=STARTF_USESTDHANDLES;si.hStdOutput=writePipe;si.hStdError=writePipe;si.hStdInput=GetStdHandle(STD_INPUT_HANDLE);PROCESS_INFORMATION pi{};std::vector<wchar_t> mutableCommand(command.begin(),command.end());mutableCommand.push_back(0);BOOL ok=CreateProcessW(nullptr,mutableCommand.data(),nullptr,nullptr,TRUE,CREATE_NO_WINDOW,nullptr,cwd.c_str(),&si,&pi);CloseHandle(writePipe);if(!ok){CloseHandle(readPipe);return L"CreateProcess failed: "+std::to_wstring(GetLastError());}std::string bytes;char buffer[4096];DWORD got=0;while(ReadFile(readPipe,buffer,sizeof(buffer),&got,nullptr)&&got)bytes.append(buffer,got);WaitForSingleObject(pi.hProcess,60000);GetExitCodeProcess(pi.hProcess,&exitCode);CloseHandle(pi.hThread);CloseHandle(pi.hProcess);CloseHandle(readPipe);return std::wstring(bytes.begin(),bytes.end());}
    static BOOL CALLBACK findHostedWindow(HWND window,LPARAM value){DWORD pid=0;GetWindowThreadProcessId(window,&pid);auto self=(Shell*)value;if(pid==self->hostedPid_&&IsWindowVisible(window)&&GetWindow(window,GW_OWNER)==nullptr){self->hostedWindow_=window;return FALSE;}return TRUE;}
    void hostProcessWindow(DWORD pid){hostedPid_=pid;hostedWindow_=nullptr;for(int i=0;i<30&&!hostedWindow_;++i){EnumWindows(findHostedWindow,(LPARAM)this);if(!hostedWindow_)Sleep(100);}if(hostedWindow_){LONG_PTR style=GetWindowLongPtrW(hostedWindow_,GWL_STYLE);style&=~WS_POPUP;style|=WS_CHILD;SetWindowLongPtrW(hostedWindow_,GWL_STYLE,style);SetParent(hostedWindow_,hwnd_);SetWindowPos(hostedWindow_,HWND_TOP,layout_.margin+35,layout_.topBar+80,std::max(320,layout_.width/2),std::max(220,layout_.workspaceBottom()/2),SWP_SHOWWINDOW|SWP_FRAMECHANGED);terminal_.push_back(L"Hosted compatible app window inside Trusten OS");}else terminal_.push_back(L"App launched; no compatible top-level window was found");}
    std::wstring compilerPath(){wchar_t found[MAX_PATH]{};if(SearchPathW(nullptr,L"g++.exe",nullptr,MAX_PATH,found,nullptr))return found;for(wchar_t drive=L'C';drive<=L'Z';++drive){std::wstring path=std::wstring(1,drive)+L":\\mingw\\bin\\g++.exe";if(GetFileAttributesW(path.c_str())!=INVALID_FILE_ATTRIBUTES)return path;}return L"";}
    void createCppFile(){
        try{
            if(std::filesystem::exists(workspace_.resolve(studioFile_))){studioStatus_=L"Projects\\main.cpp already exists";return;}
            const std::string sdk=R"SDK(#pragma once
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <winhttp.h>
#include <string>

namespace trusten_sdk {
enum class BuiltInApp : int { Files, Terminal, Metrics, Processes, Settings, Notes, Developer, Studio, Browser, Paint, Media, Assistant, Camera, Gallery, Recorder, VideoEditor, About };
inline constexpr ULONG_PTR NotifyMessage = 0x54524E01;
inline constexpr ULONG_PTR OpenAppMessage = 0x54524E02;
inline constexpr ULONG_PTR PickFileMessage = 0x54524E03;
inline constexpr ULONG_PTR PickFolderMessage = 0x54524E04;
inline constexpr ULONG_PTR HostWindowMessage = 0x54524E05;
inline HWND findShell() { return FindWindowW(L"TrustenOS.GlassDesktop", nullptr); }
inline bool notify(const std::wstring& title, const std::wstring& body) {
    HWND shell = findShell();
    if (!shell) return false;
    std::wstring payload = title + L"\n" + body;
    COPYDATASTRUCT data{NotifyMessage, static_cast<DWORD>((payload.size()+1)*sizeof(wchar_t)), payload.data()};
    return SendMessageW(shell, WM_COPYDATA, 0, reinterpret_cast<LPARAM>(&data)) != 0;
}
inline bool openBuiltIn(BuiltInApp app) {
    HWND shell = findShell();
    if (!shell) return false;
    int value = static_cast<int>(app);
    COPYDATASTRUCT data{OpenAppMessage, static_cast<DWORD>(sizeof(value)), &value};
    return SendMessageW(shell, WM_COPYDATA, 0, reinterpret_cast<LPARAM>(&data)) != 0;
}
}
)SDK";
            const std::string example=R"CPP(#include "TrustenSDK.hpp"

int WINAPI WinMain(HINSTANCE, HINSTANCE, LPSTR, int) {
    trusten_sdk::notify(L"Hello from my app", L"The Trusten SDK notification channel is working.");
    trusten_sdk::openBuiltIn(trusten_sdk::BuiltInApp::Files);
    return 0;
}
)CPP";
            workspace_.write(L"Projects\\TrustenSDK.hpp",sdk);
            workspace_.write(studioFile_,example);
            studioStatus_=L"Created corrected TrustenSDK.hpp and main.cpp";
        }catch(...){studioStatus_=L"Create failed";}
    }
    void editCppFile(){try{auto data=workspace_.read(studioFile_);editor_.set(std::wstring(data.begin(),data.end()));editorPath_=studioFile_;openWindow(AppType::Notes);studioStatus_=L"Opened in Notes editor";}catch(...){studioStatus_=L"File not found; create it first";}}
    void buildCppFile(bool runAfter){try{openWindow(AppType::Terminal);terminal_.push_back(L"=== Build started: "+studioFile_+L" ===");auto compiler=compilerPath();if(compiler.empty()){studioStatus_=L"g++.exe not found";terminal_.push_back(studioStatus_);return;}auto source=workspace_.resolve(studioFile_);auto output=source.parent_path()/(source.stem().wstring()+L".exe");std::wstring command=L"\""+compiler+L"\" -std=c++17 -O2 -DUNICODE -D_UNICODE -mwindows -static -static-libgcc -static-libstdc++ \""+source.wstring()+L"\" -o \""+output.wstring()+L"\" -luser32 -lgdi32 -ladvapi32 -lkernel32";DWORD code=1;auto captured=runCaptured(command,workspace_.root(),code);lastBuildOutput_=captured;std::wistringstream lines(captured);for(std::wstring line;std::getline(lines,line);)terminal_.push_back(line);terminal_.push_back(L"=== Compiler exit code "+std::to_wstring(code)+L" ===");if(code!=0){studioStatus_=L"Build failed";return;}studioStatus_=L"Build succeeded: "+output.filename().wstring();if(runAfter){STARTUPINFOW si{};si.cb=sizeof(si);PROCESS_INFORMATION pi{};std::wstring exe=output.wstring();std::vector<wchar_t> mutableExe(exe.begin(),exe.end());mutableExe.push_back(0);if(CreateProcessW(nullptr,mutableExe.data(),nullptr,nullptr,FALSE,0,nullptr,output.parent_path().c_str(),&si,&pi)){CloseHandle(pi.hThread);hostProcessWindow(pi.dwProcessId);CloseHandle(pi.hProcess);studioStatus_=L"Build succeeded and app launched";}else terminal_.push_back(L"Launch failed: "+std::to_wstring(GetLastError()));}}catch(...){studioStatus_=L"Build operation failed";terminal_.push_back(studioStatus_);}}
    void drawStudio(Canvas& canvas,Rect content){canvas.text(L"TRUSTEN STUDIO",{content.x,content.y,content.width,38},theme_.accent,true);canvas.text(L"Native C++ workspace with optional Groq AI",{content.x,content.y+38,content.width,27},theme_.muted);Rect aiToggle{content.x+content.width-112,content.y,112,36};canvas.glass(aiToggle,theme_,studioAiVisible_);canvas.text(studioAiVisible_?L"AI CLOSE":L"AI SIDEBAR",aiToggle,theme_.accent,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);std::array<const wchar_t*,4> actions{L"NEW C++",L"EDIT",L"BUILD",L"RUN"};int gap=10,width=(content.width-gap*3)/4;for(int i=0;i<4;++i){Rect button{content.x+i*(width+gap),content.y+78,width,50};canvas.glass(button,theme_);canvas.text(actions[i],button,theme_.accent,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);}canvas.glass({content.x,content.y+145,content.width,content.height-145},theme_);canvas.text(L"File: "+studioFile_,{content.x+16,content.y+157,content.width-32,28},theme_.text,false,true);canvas.text(L"Status: "+studioStatus_,{content.x+16,content.y+190,content.width-32,30},theme_.accentSecondary,false,true);canvas.text(L"Right-click anywhere in this window for the context menu.",{content.x+16,content.y+225,content.width-32,28},theme_.muted);canvas.text(L"Studio UI is native; AI uses WinHTTP without browser components.",{content.x+16,content.y+258,content.width-32,28},theme_.muted);Rect addonMode{content.x+16,content.y+294,170,40},install{content.x+196,content.y+294,170,40};canvas.glass(addonMode,theme_,addonMode_);canvas.glass(install,theme_);canvas.text(addonMode_?L"ADDON MODE ON":L"ADDON MODE",addonMode,theme_.accent,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);canvas.text(L"INSTALL JSON",install,theme_.accentSecondary,false,true,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);canvas.text(L"Addon: "+addonStatus_,{content.x+16,content.y+340,content.width-32,26},theme_.text,false,true);int addonY=content.y+372;for(size_t i=0;i<addons_.size()&&addonY+28<content.y+content.height;++i){canvas.text(L"["+addons_[i].type+L"] "+addons_[i].name,{content.x+20,addonY,content.width-40,26},theme_.accent);addonY+=28;}if(studioMenuVisible_){Rect menu{studioMenuPoint_.x,studioMenuPoint_.y,190,172};canvas.glass(menu,theme_,true);std::array<const wchar_t*,4> items{L"Create C++ file",L"Edit C++ file",L"Build C++ file",L"Run C++ file"};for(int i=0;i<4;++i)canvas.text(items[i],{menu.x+10,menu.y+8+i*40,menu.width-20,36},theme_.text,false,false,false,DT_LEFT|DT_VCENTER|DT_SINGLELINE);}}
    void studioContext(Point p){if(stage_!=Stage::Desktop)return;std::vector<VirtualWindow*> ordered;for(auto&window:windows_)if(!window.minimized)ordered.push_back(&window);std::sort(ordered.begin(),ordered.end(),[](auto*a,auto*b){return a->z>b->z;});for(auto*window:ordered){Rect box=actualBounds(*window);if(window->app==AppType::Studio&&box.contains(p)){focusWindow(window->id);studioMenuVisible_=true;studioMenuPoint_={std::clamp(p.x,0,layout_.width-195),std::clamp(p.y,layout_.topBar,layout_.workspaceBottom()-180)};repaint();return;}}studioMenuVisible_=false;repaint();}
    std::wstring relativeEntry(int index)const{if(index<0||index>=(int)files_.size())return L"";auto name=files_[index].path().filename().wstring();return currentDirectory_+(currentDirectory_.empty()?L"":L"\\")+name;}
    bool cppEntry(int index)const{if(index<0||index>=(int)files_.size()||files_[index].is_directory())return false;auto ext=files_[index].path().extension().wstring();std::transform(ext.begin(),ext.end(),ext.begin(),::towlower);return ext==L".cpp";}
    bool textEntry(int index)const{
        if(index<0||index>=(int)files_.size()||files_[index].is_directory())return false;
        auto ext=files_[index].path().extension().wstring();
        std::transform(ext.begin(),ext.end(),ext.begin(),::towlower);
        return ext==L".txt"||ext==L".hpp"||ext==L".h"||ext==L".ini"||ext==L".json"||ext==L".log"||ext==L".bat"||ext==L".cmd"||ext==L".md";
    }
    void newCppInCurrent(){try{std::wstring base=currentDirectory_+(currentDirectory_.empty()?L"":L"\\")+L"NewFile.cpp";int n=1;while(std::filesystem::exists(workspace_.resolve(base)))base=currentDirectory_+(currentDirectory_.empty()?L"":L"\\")+L"NewFile"+std::to_wstring(n++)+L".cpp";workspace_.write(base,"#include \"TrustenSDK.hpp\"\r\n\r\nint WINAPI WinMain(HINSTANCE,HINSTANCE,LPSTR,int){\r\n    trusten_sdk::notify(L\"New Trusten app\",L\"Hello from the generated C++ sample.\");\r\n    return 0;\r\n}\r\n");contextStatus_=L"Created "+base;refreshFiles();}catch(...){contextStatus_=L"Could not create C++ file";}}
    void newTextInCurrent(){
        try{
            std::wstring base=currentDirectory_+(currentDirectory_.empty()?L"":L"\\")+L"New Text File.txt";
            int n=1;
            while(std::filesystem::exists(workspace_.resolve(base)))
                base=currentDirectory_+(currentDirectory_.empty()?L"":L"\\")+L"New Text File "+std::to_wstring(n++)+L".txt";
            workspace_.write(base,"");
            contextStatus_=L"Created "+base;
            refreshFiles();
        }catch(...){contextStatus_=L"Could not create text file";}
    }
    void newFolderInCurrent(){try{std::wstring base=currentDirectory_+(currentDirectory_.empty()?L"":L"\\")+L"New Folder";int n=1;while(std::filesystem::exists(workspace_.resolve(base)))base=currentDirectory_+(currentDirectory_.empty()?L"":L"\\")+L"New Folder "+std::to_wstring(n++);std::filesystem::create_directories(workspace_.resolve(base));contextStatus_=L"Created "+base;refreshFiles();}catch(...){contextStatus_=L"Could not create folder";}}
    void openEntryInFiles(int index){if(index<0||index>=(int)files_.size())return;if(files_[index].is_directory())currentDirectory_=relativeEntry(index);else currentDirectory_=std::filesystem::path(relativeEntry(index)).parent_path().wstring();refreshFiles();openWindow(AppType::Files);}
    void editCppEntry(int index){try{auto relative=relativeEntry(index);auto data=workspace_.read(relative);editor_.set(std::wstring(data.begin(),data.end()));editorPath_=relative;openWindow(AppType::Notes);contextStatus_=L"Opened in Notes";}catch(...){contextStatus_=L"Open failed";}}
    void compileCppEntry(int index){auto relative=relativeEntry(index);if(relative.empty())return;studioFile_=relative;buildCppFile(false);contextStatus_=studioStatus_;}
    void renameEntry(int index){try{auto oldPath=workspace_.resolve(relativeEntry(index));auto stem=oldPath.stem().wstring(),ext=oldPath.extension().wstring();auto target=oldPath.parent_path()/(stem+L"_renamed"+ext);int n=1;while(std::filesystem::exists(target))target=oldPath.parent_path()/(stem+L"_renamed"+std::to_wstring(n++)+ext);std::filesystem::rename(oldPath,target);contextStatus_=L"Renamed to "+target.filename().wstring();refreshFiles();}catch(...){contextStatus_=L"Rename failed";}}
    void deleteEntry(int index){try{auto path=workspace_.resolve(relativeEntry(index));std::wstring prompt=L"Delete "+path.filename().wstring()+L"?";if(MessageBoxW(hwnd_,prompt.c_str(),L"Trusten OS",MB_YESNO|MB_ICONWARNING)==IDYES){std::filesystem::remove_all(path);contextStatus_=L"Deleted";refreshFiles();}}catch(...){contextStatus_=L"Delete failed";}}
    void moveEntry(int index){openMovePopup(index);}
    void openSelectedEntry(int index){
        if(index<0||index>=(int)files_.size())return;
        if(files_[index].is_directory()){
            navigateFiles(relativeEntry(index));
            return;
        }
        if(cppEntry(index)||textEntry(index)){
            editCppEntry(index);
            return;
        }
        auto selectedPath=files_[index].path();
        if(imageFile(selectedPath)){loadPaintImage(selectedPath.wstring());openWindow(AppType::Paint);return;}
        if(mediaFile(selectedPath)){loadMedia(selectedPath.wstring());openWindow(AppType::Media);return;}
        auto selectedExt=selectedPath.extension().wstring();std::transform(selectedExt.begin(),selectedExt.end(),selectedExt.begin(),::towlower);
        if(selectedExt==L".html"||selectedExt==L".htm"||selectedExt==L".svg"||selectedExt==L".pdf"){openWindow(AppType::Browser);if(auto*w=activeWindow())showWebApp(w->id,AppType::Browser,webFileUrl(selectedPath));return;}
        using ShellExecuteFn=HINSTANCE (WINAPI*)(HWND,LPCWSTR,LPCWSTR,LPCWSTR,LPCWSTR,INT);
        HMODULE module=LoadLibraryW(L"shell32.dll");
        if(!module){contextStatus_=L"No file handler available";return;}
        FARPROC procedure=GetProcAddress(module,"ShellExecuteW");
        if(!procedure){FreeLibrary(module);contextStatus_=L"No file handler available";return;}
        static_assert(sizeof(ShellExecuteFn)==sizeof(procedure));
        ShellExecuteFn execute=nullptr;std::memcpy(&execute,&procedure,sizeof(execute));
        auto path=files_[index].path().wstring();
        auto result=(INT_PTR)execute(hwnd_,L"open",path.c_str(),nullptr,files_[index].path().parent_path().c_str(),SW_SHOWNORMAL);
        FreeLibrary(module);
        contextStatus_=result>32?L"Opened "+files_[index].path().filename().wstring():L"No application is registered for this file";
    }
    void placeNotesCaret(Point p,Rect content){
        const int lineHeight=19;
        const int charWidth=9;
        int visualLine=std::max(0,(p.y-(content.y+43))/lineHeight);
        int targetLine=notesScrollLine_+visualLine;
        int targetColumn=notesScrollColumn_+std::max(0,(p.x-content.x+charWidth/2)/charWidth);
        const auto& text=editor_.text();size_t lineStart=0;
        for(int line=0;line<targetLine&&lineStart<text.size();++line){size_t next=text.find(L'\n',lineStart);if(next==std::wstring::npos){lineStart=text.size();break;}lineStart=next+1;}
        size_t lineEnd=text.find(L'\n',lineStart);if(lineEnd==std::wstring::npos)lineEnd=text.size();
        editor_.setCaret(std::min(lineStart+(size_t)targetColumn,lineEnd));
        revealNotesCaret();
    }
    void drawFileContext(Canvas& canvas){
        if(contextKind_==ContextKind::None)return;
        int rows=contextKind_==ContextKind::Background?4:contextKind_==ContextKind::CppFile?6:contextKind_==ContextKind::TextFile?5:contextKind_==ContextKind::OtherFile?4:4;
        int width=230,height=rows*39+16;
        Rect menu{std::clamp(contextPoint_.x,0,layout_.width-width-4),std::clamp(contextPoint_.y,layout_.topBar,layout_.workspaceBottom()-height),width,height};
        contextPoint_={menu.x,menu.y};canvas.glass(menu,theme_,true);
        if(contextKind_==ContextKind::Background){
            std::array<const wchar_t*,4> items{L"Refresh",L"New C++ file",L"New text file",L"New folder"};
            for(int i=0;i<4;++i)canvas.text(items[i],{menu.x+12,menu.y+8+i*39,menu.width-24,35},theme_.text);
        }else if(contextKind_==ContextKind::CppFile){
            std::array<const wchar_t*,6> items{L"Compile",L"Edit in Notes",L"Open file dir in Files",L"Rename",L"Delete",L"Move into dir"};
            for(int i=0;i<6;++i)canvas.text(items[i],{menu.x+12,menu.y+8+i*39,menu.width-24,35},i==4?COLOR_DANGER:theme_.text);
        }else if(contextKind_==ContextKind::TextFile){
            std::array<const wchar_t*,5> items{L"Edit in Notes",L"Open file dir in Files",L"Rename",L"Delete",L"Move into dir"};
            for(int i=0;i<5;++i)canvas.text(items[i],{menu.x+12,menu.y+8+i*39,menu.width-24,35},i==3?COLOR_DANGER:theme_.text);
        }else if(contextKind_==ContextKind::OtherFile){
            std::array<const wchar_t*,4> items{L"Open file dir in Files",L"Rename",L"Delete",L"Move into dir"};
            for(int i=0;i<4;++i)canvas.text(items[i],{menu.x+12,menu.y+8+i*39,menu.width-24,35},i==2?COLOR_DANGER:theme_.text);
        }else{
            std::array<const wchar_t*,4> items{L"Open folder",L"Rename",L"Delete",L"Move into dir"};
            for(int i=0;i<4;++i)canvas.text(items[i],{menu.x+12,menu.y+8+i*39,menu.width-24,35},i==2?COLOR_DANGER:theme_.text);
        }
    }
    void fileContext(Point p){if(stage_!=Stage::Desktop)return;contextKind_=ContextKind::None;contextFileIndex_=-1;std::vector<VirtualWindow*>ordered;for(auto&window:windows_)if(!window.minimized)ordered.push_back(&window);std::sort(ordered.begin(),ordered.end(),[](auto*a,auto*b){return a->z>b->z;});for(auto*window:ordered){Rect box=actualBounds(*window);if(window->app==AppType::Files&&box.contains(p)){focusWindow(window->id);Rect content{box.x+12,box.y+WINDOW_TITLE_HEIGHT+8,box.width-24,box.height-WINDOW_TITLE_HEIGHT-20};int row=(p.y-(content.y+32))/33;if(row>=0&&row<(int)files_.size()){contextFileIndex_=row;contextKind_=files_[row].is_directory()?ContextKind::Folder:(cppEntry(row)?ContextKind::CppFile:(textEntry(row)?ContextKind::TextFile:ContextKind::OtherFile));}else contextKind_=ContextKind::Background;contextPoint_=p;repaint();return;}}contextKind_=ContextKind::Background;contextPoint_=p;repaint();}
    bool activateFileContext(Point p){
        if(contextKind_==ContextKind::None)return false;
        int rows=contextKind_==ContextKind::Background?4:contextKind_==ContextKind::CppFile?6:contextKind_==ContextKind::TextFile?5:4;
        Rect menu{contextPoint_.x,contextPoint_.y,230,rows*39+16};
        if(!menu.contains(p)){contextKind_=ContextKind::None;return false;}
        int action=(p.y-menu.y-8)/39;
        if(contextKind_==ContextKind::Background){
            if(action==0)refreshFiles();else if(action==1)newCppInCurrent();else if(action==2)newTextInCurrent();else if(action==3)newFolderInCurrent();
        }else if(contextKind_==ContextKind::CppFile){
            if(action==0)compileCppEntry(contextFileIndex_);else if(action==1)editCppEntry(contextFileIndex_);else if(action==2)openEntryInFiles(contextFileIndex_);else if(action==3)renameEntry(contextFileIndex_);else if(action==4)deleteEntry(contextFileIndex_);else if(action==5)moveEntry(contextFileIndex_);
        }else if(contextKind_==ContextKind::TextFile){
            if(action==0)editCppEntry(contextFileIndex_);else if(action==1)openEntryInFiles(contextFileIndex_);else if(action==2)renameEntry(contextFileIndex_);else if(action==3)deleteEntry(contextFileIndex_);else if(action==4)moveEntry(contextFileIndex_);
        }else{
            if(action==0)openEntryInFiles(contextFileIndex_);else if(action==1)renameEntry(contextFileIndex_);else if(action==2)deleteEntry(contextFileIndex_);else if(action==3)moveEntry(contextFileIndex_);
        }
        contextKind_=ContextKind::None;repaint();return true;
    }
    void drawNotificationCenter(Canvas& canvas){
        if (!notificationCenterVisible_) {
            return;
        }
        Rect panel{std::max(12,layout_.width-430),58,410,std::min(520,layout_.workspaceBottom()-70)};
        canvas.glass(panel,theme_,true);
        canvas.text(L"NOTIFICATIONS",{panel.x+16,panel.y+10,panel.width-32,36},theme_.text,true);
        int y=panel.y+55;
        std::lock_guard<std::mutex> lock(notificationMutex_);
        for(auto it=notifications_.rbegin();it!=notifications_.rend()&&y+72<panel.y+panel.height;++it){
            Rect card{panel.x+12,y,panel.width-24,66};
            canvas.glass(card,theme_);
            canvas.text(it->title,{card.x+10,card.y+5,card.width-20,24},theme_.accent,false,true);
            canvas.text(it->body,{card.x+10,card.y+28,card.width-20,31},theme_.text,false,false,false,DT_LEFT|DT_WORDBREAK|DT_END_ELLIPSIS);
            y+=72;
        }
        if (notifications_.empty()) {
            canvas.text(L"You're all caught up.",{panel.x+16,panel.y+70,panel.width-32,30},theme_.muted);
        }
    }
    void drawDesktop(Canvas& canvas){
        drawAnimatedBackdrop(canvas);drawDesktopFiles(canvas);drawTopBar(canvas);
        std::vector<VirtualWindow*> ordered;for(auto&window:windows_)if(!window.minimized)ordered.push_back(&window);
        std::sort(ordered.begin(),ordered.end(),[](auto*a,auto*b){return a->z<b->z;});for(auto*window:ordered)drawWindow(canvas,*window);
        drawDock(canvas);keyboard_.draw(canvas,layout_.keyboardRect(),theme_);
        if (launcherVisible_) drawLauncher(canvas);
        if (notificationCenterVisible_) drawNotificationCenter(canvas);
        if (contextKind_ != ContextKind::None) drawFileContext(canvas);
        if (accountModal_) drawAccountModal(canvas);
        if (movePopup_) drawMovePopup(canvas);
        if (shutdownPromptVisible_) drawShutdownPrompt(canvas);
    }
    void drawShutdown(Canvas& canvas){
        drawAnimatedBackdrop(canvas);canvas.text(L"TRUSTEN OS",{0,layout_.height/2-95,layout_.width,70},theme_.accent,false,false,true,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
        canvas.text(restartRequested_?L"RESTARTING":L"SHUTTING DOWN",{0,layout_.height/2-10,layout_.width,40},theme_.text,true,false,false,DT_CENTER|DT_VCENTER|DT_SINGLELINE);
        int width=std::min(500,layout_.width-80);Rect bar{(layout_.width-width)/2,layout_.height/2+52,width,12};canvas.rounded(bar,RGB(20,31,51),6);canvas.gradient({bar.x,bar.y,(int)(bar.width*shutdownProgress_),bar.height},theme_.accentSecondary,theme_.accent);
    }
    void paint(){
        PAINTSTRUCT ps{};HDC dc=BeginPaint(hwnd_,&ps);RECT client{};GetClientRect(hwnd_,&client);
        layout_=Layout::calculate(client.right,client.bottom,keyboard_.visible);
        { Canvas canvas(dc,client.right,client.bottom);
          if(stage_==Stage::Startup)drawStartup(canvas);else if(stage_==Stage::Lock)drawLock(canvas);else if(stage_==Stage::Login)drawLogin(canvas);else if(stage_==Stage::Shutdown)drawShutdown(canvas);else drawDesktop(canvas); }
        EndPaint(hwnd_,&ps);
    }
    void handleText(wchar_t c){
        if(accountModal_){if(c>=32){if(loginField_==0)accountName_+=c;else accountPin_+=c;}return;}if(stage_==Stage::Login){if(c>=32)loginName_+=c;return;}if(loginField_==2){if(c>=32)addressBar_+=c;return;}
        if(auto*window=activeWindow()){
            if((window->app==AppType::Assistant||(window->app==AppType::Studio&&studioAiVisible_))&&c>=32){if(aiFocus_==1)groqKey_+=c;else if(aiFocus_==2)aiPrompt_+=c;}
            else if(window->app==AppType::Terminal&&c>=32)terminalInput_+=c;
            else if(window->app==AppType::Notes&&(c>=32||c==L'\n'))editor_.insert(c);
        }
    }
    void handleBackspace(){
        if(accountModal_){auto&field=loginField_==0?accountName_:accountPin_;if(!field.empty())field.pop_back();return;}if(stage_==Stage::Login){if(!loginName_.empty())loginName_.pop_back();return;}if(loginField_==2){if(!addressBar_.empty())addressBar_.pop_back();return;}
        if(auto*window=activeWindow()){
            if(window->app==AppType::Assistant||(window->app==AppType::Studio&&studioAiVisible_)){auto& field=aiFocus_==1?groqKey_:aiPrompt_;if(!field.empty())field.pop_back();}
            else if(window->app==AppType::Terminal&&!terminalInput_.empty())terminalInput_.pop_back();
            else if(window->app==AppType::Notes)editor_.backspace();
        }
    }
    void handleKeyboardResult(TouchKeyboard::Result result){
        if(result.action==TouchKeyboard::Action::Character)handleText(result.character);
        else if(result.action==TouchKeyboard::Action::Space)handleText(L' ');
        else if(result.action==TouchKeyboard::Action::Backspace)handleBackspace();
        else if(result.action==TouchKeyboard::Action::Shift)keyboard_.shift=!keyboard_.shift;
        else if(result.action==TouchKeyboard::Action::Enter){if(accountModal_)saveAccount();else if(loginField_==2){navigateFiles(addressBar_);loginField_=0;}else if(stage_==Stage::Login)startSession();else handleText(L'\n');}
        else if(result.action==TouchKeyboard::Action::Close)keyboard_.visible=false;
        repaint();
    }
    int resizeMaskFor(Point p,Rect box) const{
        int mask=ResizeNone;
        if(p.x<box.x+RESIZE_EDGE)mask|=ResizeLeft;
        if(p.x>=box.x+box.width-RESIZE_EDGE)mask|=ResizeRight;
        if(p.y<box.y+RESIZE_EDGE)mask|=ResizeTop;
        if(p.y>=box.y+box.height-RESIZE_EDGE)mask|=ResizeBottom;
        return mask;
    }
    void mouseDown(Point p,bool doubleClick){
        if(stage_==Stage::Lock){stage_=Stage::Login;keyboard_.visible=layout_.device!=DeviceClass::Desktop;repaint();return;}
        if(stage_==Stage::Login){
            if(forgotPinVisible_){int w=std::min(540,layout_.width-40);Rect panel{(layout_.width-w)/2,layout_.height/2-145,w,290},remind{panel.x+28,panel.y+175,150,52},reset{panel.x+195,panel.y+175,150,52},cancel{panel.x+362,panel.y+175,150,52};if(remind.contains(p)){notify(L"Last use reminder",lastUseReminder());forgotPinVisible_=false;}else if(reset.contains(p)){forgotPinVisible_=false;accountModal_=true;accountEditing_=true;accountName_=loginName_;accountPin_.clear();loginField_=1;}else if(cancel.contains(p))forgotPinVisible_=false;repaint();return;}
            if(accountModal_){int width=std::min(480,layout_.width-40);Rect panel{(layout_.width-width)/2,layout_.height/2-170,width,340},user{panel.x+38,panel.y+82,panel.width-76,50},pinField{panel.x+38,panel.y+151,panel.width-76,50},save{panel.x+60,panel.y+242,150,48},cancel{panel.x+panel.width-210,panel.y+242,150,48};if(user.contains(p))loginField_=0;else if(pinField.contains(p))loginField_=1;else if(save.contains(p))saveAccount();else if(cancel.contains(p))accountModal_=false;repaint();return;}
            int width=std::min(560,layout_.width-32),height=500;Rect card{(layout_.width-width)/2,(layout_.height-height)/2,width,height};Rect pin{card.x+62,card.y+258,card.width-124,54},login{card.x+62,card.y+330,card.width-124,54},forgot{card.x+card.width/2-110,card.y+398,220,34};if(pin.contains(p)){loginField_=1;keyboard_.visible=layout_.device!=DeviceClass::Desktop;}else if(login.contains(p))startSession();else if(forgot.contains(p)){workspace_.open(loginName_);forgotPinVisible_=true;}Rect users{18,std::max(70,layout_.height/2-190),190,380};int uy=users.y+54;for(size_t i=0;i<knownUsers_.size()&&i<8;++i){if(Rect{users.x+10,uy,users.width-20,40}.contains(p)){loginName_=knownUsers_[i];loginPin_.clear();}uy+=46;}if(Rect{users.x+10,users.y+users.height-52,users.width-20,40}.contains(p)){accountModal_=true;accountEditing_=false;accountName_.clear();accountPin_.clear();loginField_=0;}if(keyboard_.visible&&layout_.keyboardRect().contains(p))handleKeyboardResult(keyboard_.hit(p,layout_.keyboardRect()));repaint();return;}
        if(stage_!=Stage::Desktop)return;
        if(accountModal_){int width=std::min(480,layout_.width-40);Rect panel{(layout_.width-width)/2,layout_.height/2-170,width,340},user{panel.x+38,panel.y+82,panel.width-76,50},pin{panel.x+38,panel.y+151,panel.width-76,50},save{panel.x+60,panel.y+242,150,48},cancel{panel.x+panel.width-210,panel.y+242,150,48};if(user.contains(p))loginField_=0;else if(pin.contains(p))loginField_=1;else if(save.contains(p))saveAccount();else if(cancel.contains(p))accountModal_=false;repaint();return;}
        if(movePopup_){int width=std::min(560,layout_.width-40),height=std::min(520,layout_.height-80);Rect panel{(layout_.width-width)/2,(layout_.height-height)/2,width,height},tree{panel.x+22,panel.y+84,panel.width-44,panel.height-160},move{panel.x+52,panel.y+panel.height-62,180,44},cancel{panel.x+panel.width-232,panel.y+panel.height-62,180,44};if(tree.contains(p)){int row=(p.y-(tree.y+8))/30;if(row>=0&&row<(int)moveTargets_.size())moveTargetIndex_=row;}else if(move.contains(p))performMoveSelection();else if(cancel.contains(p))movePopup_=false;repaint();return;}
        if(activateTaskMenu(p))return;
        if(activateFileContext(p))return;
        if(shutdownPromptVisible_){int width=std::min(620,layout_.width-40);Rect panel{(layout_.width-width)/2,layout_.height/2-135,width,270};int gap=14,buttonWidth=(panel.width-80-gap*2)/3;Rect shutdown{panel.x+40,panel.y+165,buttonWidth,54},restart{shutdown.x+buttonWidth+gap,panel.y+165,buttonWidth,54},cancel{restart.x+buttonWidth+gap,panel.y+165,buttonWidth,54};if(shutdown.contains(p)||restart.contains(p)){restartRequested_=restart.contains(p);shutdownPromptVisible_=false;stage_=Stage::Shutdown;shutdownProgress_=0;}else if(cancel.contains(p))shutdownPromptVisible_=false;repaint();return;}
        if(Rect{16,9,136,40}.contains(p)){launcherVisible_=!launcherVisible_;repaint();return;}
        if(Rect{layout_.width-274,9,58,38}.contains(p)){notificationCenterVisible_=!notificationCenterVisible_;repaint();return;}
        if(Rect{layout_.width-208,9,58,38}.contains(p)){keyboard_.visible=!keyboard_.visible;repaint();return;}
        if(Rect{layout_.width-142,9,58,38}.contains(p)){stage_=Stage::Lock;keyboard_.visible=false;repaint();return;}
        if(Rect{layout_.width-76,9,58,38}.contains(p)){shutdownPromptVisible_=true;repaint();return;}
        if(keyboard_.visible&&layout_.keyboardRect().contains(p)){handleKeyboardResult(keyboard_.hit(p,layout_.keyboardRect()));return;}
        if(launcherVisible_){int width=layout_.device==DeviceClass::Phone?layout_.width-24:std::min(620,layout_.width-40);Rect panel{16,58,width,std::min(470,layout_.workspaceBottom()-80)};if(panel.contains(p)){int columns=layout_.device==DeviceClass::Phone?2:4,gap=10,tileWidth=(panel.width-36-gap*(columns-1))/columns;int column=(p.x-panel.x-18)/(tileWidth+gap),row=(p.y-panel.y-86)/70,index=row*columns+column;if(index>=0&&index<13){openWindow((AppType)index);launcherVisible_=false;}repaint();return;}launcherVisible_=false;}
        if(layout_.dockRect().contains(p)){int gap=3,width=std::max(42,(layout_.width-layout_.margin*2-gap*12)/13),index=(p.x-layout_.margin)/std::max(1,width+gap);if(index>=0&&index<13)openWindow((AppType)index);repaint();return;}
        std::vector<VirtualWindow*> ordered;for(auto&window:windows_)if(!window.minimized)ordered.push_back(&window);
        std::sort(ordered.begin(),ordered.end(),[](auto*a,auto*b){return a->z>b->z;});
        for(auto*window:ordered){
            Rect box=actualBounds(*window);if(!box.contains(p))continue;focusWindow(window->id);
            Rect minimize{box.x+box.width-126,box.y+7,34,28},maximize{box.x+box.width-86,box.y+7,34,28},close{box.x+box.width-46,box.y+7,34,28};
            if(close.contains(p)){closeWindow(window->id);repaint();return;}
            if(minimize.contains(p)){window->minimized=true;repaint();return;}
            if(maximize.contains(p)){if(!window->maximized)window->restoreBounds=window->bounds;else window->bounds=window->restoreBounds;window->maximized=!window->maximized;repaint();return;}
            int mask=window->maximized?ResizeNone:resizeMaskFor(p,box);
            if(mask){resizeWindowId_=window->id;resizeMask_=mask;dragOffset_=p;SetCapture(hwnd_);return;}
            if(p.y<box.y+WINDOW_TITLE_HEIGHT&&!window->maximized){dragWindowId_=window->id;dragOffset_={p.x-box.x,p.y-box.y};SetCapture(hwnd_);return;}
            if(window->app==AppType::Files){Rect content{box.x+12,box.y+WINDOW_TITLE_HEIGHT+8,box.width-24,box.height-WINDOW_TITLE_HEIGHT-20};Rect back{content.x,content.y,44,34},forward{content.x+49,content.y,44,34},up{content.x+98,content.y,44,34},address{content.x+148,content.y,content.width-420,34},newText{content.x+content.width-266,content.y,78,34},newFolder{content.x+content.width-183,content.y,84,34},refresh{content.x+content.width-94,content.y,94,34};if(back.contains(p)&&fileHistoryIndex_>0){--fileHistoryIndex_;navigateFiles(fileHistory_[fileHistoryIndex_],false);repaint();return;}if(forward.contains(p)&&fileHistoryIndex_+1<(int)fileHistory_.size()){++fileHistoryIndex_;navigateFiles(fileHistory_[fileHistoryIndex_],false);repaint();return;}if(up.contains(p)){auto parent=std::filesystem::path(currentDirectory_).parent_path().wstring();if(!parent.empty())navigateFiles(parent);repaint();return;}if(newText.contains(p)){newTextInCurrent();repaint();return;}if(newFolder.contains(p)){newFolderInCurrent();repaint();return;}if(refresh.contains(p)){refreshFiles();repaint();return;}if(address.contains(p)){loginField_=2;repaint();return;}int py=content.y+82;for(auto&pin:pinnedDirs_){if(Rect{content.x+12,py,126,29}.contains(p)){navigateFiles(pin);selectedFileIndex_=-1;filePreviewText_=L"Select a file or folder to preview";repaint();return;}py+=32;}int side=150,previewWidth=std::max(190,content.width/3),listX=content.x+side+10,listWidth=content.width-side-previewWidth-20,row=(p.y-(content.y+74))/33;if(p.x>=listX&&p.x<listX+listWidth&&row>=0&&row<(int)files_.size()){updateFilePreview(row);if(doubleClick){openSelectedEntry(row);selectedFileIndex_=-1;filePreviewText_=L"Select a file or folder to preview";}repaint();return;}}
            if(window->app==AppType::Notes){Rect content{box.x+12,box.y+WINDOW_TITLE_HEIGHT+8,box.width-24,box.height-WINDOW_TITLE_HEIGHT-20};Rect saveButton{content.x,content.y,86,32},saveAsButton{content.x+94,content.y,112,32};if(saveButton.contains(p)){saveNotes();repaint();return;}if(saveAsButton.contains(p)){saveNotesAs();repaint();return;}if(p.y>=content.y+43&&p.y<content.y+content.height-12&&p.x>=content.x&&p.x<content.x+content.width-12){placeNotesCaret(p,content);repaint();return;}}
            if(window->app==AppType::Paint){Rect c{box.x+12,box.y+WINDOW_TITLE_HEIGHT+8,box.width-24,box.height-WINDOW_TITLE_HEIGHT-20};Rect import{c.x+c.width-126,c.y,126,36};Rect board{c.x+132,c.y+44,c.width-132,c.height-44};if(import.contains(p)){std::wstring path=paintPath_;if(nativePickFile(hwnd_,path,L"Bitmap images\0*.bmp\0All files\0*.*\0\0"))loadPaintImage(path);repaint();return;}if(board.contains(p)){HDC dc=GetDC(hwnd_);if(doubleClick){paintDrawing_=false;}else{SetPixel(dc,p.x,p.y,theme_.accent);paintDrawing_=true;paintLast_=p;}ReleaseDC(hwnd_,dc);return;}}
            if(window->app==AppType::Media){Rect c{box.x+12,box.y+WINDOW_TITLE_HEIGHT+8,box.width-24,box.height-WINDOW_TITLE_HEIGHT-20};Rect import{c.x+c.width-146,c.y,146,36},previous{c.x,c.y+c.height-56,92,44},play{c.x+102,c.y+c.height-56,112,44},stop{c.x+224,c.y+c.height-56,92,44};if(import.contains(p)){std::wstring path=mediaPath_;if(nativePickFile(hwnd_,path,L"Media files\0*.mp3;*.wav;*.wma;*.mp4;*.avi;*.wmv\0All files\0*.*\0\0"))loadMedia(path);}else if(previous.contains(p)){mediaCommand(L"seek trustenmedia to start");mediaCommand(L"play trustenmedia");mediaPlaying_=true;}else if(play.contains(p)){if(mediaPlaying_)mediaCommand(L"pause trustenmedia");else mediaCommand(L"play trustenmedia");mediaPlaying_=!mediaPlaying_;}else if(stop.contains(p)){mediaCommand(L"stop trustenmedia");mediaPlaying_=false;}repaint();return;}
            if(window->app==AppType::Assistant){Rect c{box.x+12,box.y+WINDOW_TITLE_HEIGHT+8,box.width-24,box.height-WINDOW_TITLE_HEIGHT-20};int x=c.x+12,w=c.width-24;Rect key{x,c.y+48,w,34};int outH=std::max(80,c.height-174);Rect prompt{x,c.y+48+42+outH+8,w-92,38},send{x+w-84,prompt.y,84,38};if(key.contains(p))aiFocus_=1;else if(prompt.contains(p))aiFocus_=2;else if(send.contains(p))sendAi(false);repaint();return;}  
            if(window->app==AppType::Studio){Rect content{box.x+12,box.y+WINDOW_TITLE_HEIGHT+8,box.width-24,box.height-WINDOW_TITLE_HEIGHT-20};if(studioAiVisible_&&Rect{content.x+content.width-92,content.y+8,80,30}.contains(p)){studioAiVisible_=false;aiFocus_=0;repaint();return;}if(!studioAiVisible_&&Rect{content.x+content.width-112,content.y,112,36}.contains(p)){studioAiVisible_=true;repaint();return;}if(studioAiVisible_){int side=std::min(390,content.width/2);Rect panel{content.x+content.width-side,content.y,side,content.height};int x=panel.x+12,w=panel.width-24;Rect key{x,panel.y+48,w,34};int outH=std::max(80,panel.height-174);Rect prompt{x,panel.y+48+42+outH+8,w-92,38},send{x+w-84,prompt.y,84,38};if(key.contains(p)){aiFocus_=1;repaint();return;}if(prompt.contains(p)){aiFocus_=2;repaint();return;}if(send.contains(p)){sendAi(true);return;}}if(studioMenuVisible_){Rect menu{studioMenuPoint_.x,studioMenuPoint_.y,190,172};if(menu.contains(p)){int action=(p.y-menu.y-8)/40;if(action==0)createCppFile();else if(action==1)editCppFile();else if(action==2)buildCppFile(false);else if(action==3)buildCppFile(true);studioMenuVisible_=false;repaint();return;}studioMenuVisible_=false;}if(p.y>=content.y+78&&p.y<content.y+128){int gap=10,width=(content.width-gap*3)/4,index=(p.x-content.x)/(width+gap);if(index==0){if(addonMode_)createAddonTemplate();else createCppFile();}else if(index==1)editCppFile();else if(index==2)buildCppFile(false);else if(index==3)buildCppFile(true);repaint();return;}if(Rect{content.x+16,content.y+294,170,40}.contains(p)){addonMode_=!addonMode_;if(addonMode_)createAddonTemplate();repaint();return;}if(Rect{content.x+196,content.y+294,170,40}.contains(p)){installAddonManifest(addonMode_?addonFile_:studioFile_);repaint();return;}int addonRow=(p.y-(content.y+372))/28;if(p.y>=content.y+372&&addonRow>=0&&addonRow<(int)addons_.size()){runAddon(addonRow);repaint();return;}}
            if(window->app==AppType::Camera){Rect c{box.x+12,box.y+WINDOW_TITLE_HEIGHT+8,box.width-24,box.height-WINDOW_TITLE_HEIGHT-20};Rect photo{c.x,c.y+c.height-54,150,44},video{c.x+160,c.y+c.height-54,170,44},gallery{c.x+340,c.y+c.height-54,150,44};if(photo.contains(p)){cameraStatus_=L"Photo capture backend is not active in this build.";notify(L"Camera",cameraStatus_);}else if(video.contains(p)){cameraStatus_=L"Video capture backend is not active in this build.";notify(L"Camera",cameraStatus_);}else if(gallery.contains(p))openWindow(AppType::Gallery);repaint();return;}
            if(window->app==AppType::Recorder){Rect c{box.x+12,box.y+WINDOW_TITLE_HEIGHT+8,box.width-24,box.height-WINDOW_TITLE_HEIGHT-20};Rect record{c.x+c.width/2-90,c.y+230,180,58};if(record.contains(p)){recorderStatus_=L"Audio capture backend is not active in this build.";notify(L"Recorder",recorderStatus_);}repaint();return;}
            if(window->app==AppType::VideoEditor){Rect c{box.x+12,box.y+WINDOW_TITLE_HEIGHT+8,box.width-24,box.height-WINDOW_TITLE_HEIGHT-20};Rect tools{c.x,c.y+48,150,c.height-48};if(tools.contains(p)){int i=(p.y-(tools.y+10))/42;if(i>=0&&i<8){editorTool_=i;editorStatus_=i==7?L"Export requires ffmpeg.exe and ffprobe.exe in the Trusten tools folder.":L"Tool selected. Processing backend will activate when media dependencies are packaged.";}}repaint();return;}
            if(window->app==AppType::Settings){Rect content{box.x+12,box.y+WINDOW_TITLE_HEIGHT+8,box.width-24,box.height-WINDOW_TITLE_HEIGHT-20};if(p.y<content.y+42){int gap=8,tw=(content.width-gap*2)/3;settingsTab_=std::clamp((p.x-content.x)/(tw+gap),0,2);repaint();return;}int row=(p.y-(content.y+50))/49;if(settingsTab_==0){if(row==0)keyboard_.visible=!keyboard_.visible;else if(row==1)theme_.highContrast=!theme_.highContrast;else if(row==2)theme_.cornerRadius=theme_.cornerRadius>=30?10:theme_.cornerRadius+5;else if(row==3)theme_.density=(theme_.density+1)%3;else{int paletteY=content.y+50+4*49+36;if(p.y>=paletteY&&p.y<paletteY+44){std::array<COLORREF,8> colors{RGB(82,228,255),RGB(177,136,255),RGB(255,105,180),RGB(255,112,112),RGB(255,184,76),RGB(112,232,145),RGB(85,160,255),RGB(238,238,238)};int swatchW=std::max(34,(content.width-14*7)/8);int pick=(p.x-content.x)/(swatchW+14);if(pick>=0&&pick<8)theme_.accent=colors[pick];}}saveUserTheme();}else if(settingsTab_==1){if(row==0){windowLayout_=(WindowLayout)(((int)windowLayout_+1)%4);applyWindowLayout();}else if(row==2){accountModal_=true;accountEditing_=true;accountName_=workspace_.user();accountPin_=loginPin_;loginField_=0;}else if(row==3){savePinned();settingsStatus_=L"Pinned dirs saved";}else if(row==4)saveSettings();}else if(p.y>=content.y+50&&p.y<content.y+104)checkForUpdates(false);repaint();return;}
            if(window->app==AppType::Processes&&doubleClick&&!permissions_.processControl)showUnavailable(L"Process control");
            repaint();return;
        }
    }
    void mouseMove(Point p){
        if(auto*window=findWindow(resizeWindowId_)){
            int dx=p.x-dragOffset_.x,dy=p.y-dragOffset_.y;
            if(resizeMask_&ResizeLeft){window->bounds.x+=dx;window->bounds.width-=dx;}
            if(resizeMask_&ResizeRight)window->bounds.width+=dx;
            if(resizeMask_&ResizeTop){window->bounds.y+=dy;window->bounds.height-=dy;}
            if(resizeMask_&ResizeBottom)window->bounds.height+=dy;
            window->bounds.width=std::max(360,window->bounds.width);window->bounds.height=std::max(240,window->bounds.height);dragOffset_=p;repaint();return;
        }
        if(auto*window=findWindow(dragWindowId_)){
            window->bounds.x=std::clamp(p.x-dragOffset_.x,0,std::max(0,layout_.width-window->bounds.width));
            window->bounds.y=std::clamp(p.y-dragOffset_.y,layout_.topBar,std::max(layout_.topBar,layout_.workspaceBottom()-window->bounds.height));
            if(p.x<24)window->bounds={layout_.margin,layout_.topBar,(layout_.width-layout_.margin*3)/2,layout_.workspaceBottom()-layout_.topBar-layout_.margin};
            else if(p.x>layout_.width-24){int half=(layout_.width-layout_.margin*3)/2;window->bounds={layout_.margin*2+half,layout_.topBar,half,layout_.workspaceBottom()-layout_.topBar-layout_.margin};}
            repaint();
        }
    }
    bool saveNotes(){
        try {
            workspace_.write(editorPath_,std::string(editor_.text().begin(),editor_.text().end()));
            notesStatus_=L"Saved";
            notify(L"Notes",L"Saved "+editorPath_);
            return true;
        } catch(...) {
            notesStatus_=L"Save failed";
            MessageBoxW(hwnd_,L"The file could not be saved.",L"Trusten Notes",MB_OK|MB_ICONERROR);
            return false;
        }
    }
    bool saveNotesAs(){
        using SaveDialogFn=BOOL (WINAPI*)(LPOPENFILENAMEW);
        HMODULE module=LoadLibraryW(L"comdlg32.dll");
        if(!module){notesStatus_=L"Save As unavailable";return false;}
        FARPROC procedure=GetProcAddress(module,"GetSaveFileNameW");
        if(!procedure){FreeLibrary(module);notesStatus_=L"Save As unavailable";return false;}
        static_assert(sizeof(SaveDialogFn)==sizeof(procedure));
        SaveDialogFn dialog=nullptr;
        std::memcpy(&dialog,&procedure,sizeof(dialog));
        wchar_t path[32768]{};
        auto initial=workspace_.resolve(editorPath_).wstring();
        wcsncpy(path,initial.c_str(),32767);
        OPENFILENAMEW ofn{};
        ofn.lStructSize=sizeof(ofn);ofn.hwndOwner=hwnd_;ofn.lpstrFile=path;ofn.nMaxFile=32768;
        ofn.lpstrFilter=L"Text and code files\0*.txt;*.cpp;*.hpp;*.h;*.json;*.ini\0All files\0*.*\0";
        ofn.lpstrDefExt=L"txt";ofn.Flags=OFN_OVERWRITEPROMPT|OFN_PATHMUSTEXIST|OFN_NOCHANGEDIR;
        BOOL accepted=dialog(&ofn);FreeLibrary(module);
        if(!accepted)return false;
        try{
            std::filesystem::path destination(path);
            std::filesystem::create_directories(destination.parent_path());
            std::ofstream out(destination,std::ios::binary|std::ios::trunc);
            std::string bytes(editor_.text().begin(),editor_.text().end());
            out.write(bytes.data(),(std::streamsize)bytes.size());
            if(!out)throw std::runtime_error("save as failed");
            std::error_code error;
            auto relative=std::filesystem::relative(destination,workspace_.root(),error);
            editorPath_=error?destination.wstring():relative.wstring();
            notesStatus_=L"Saved as "+destination.filename().wstring();
            notify(L"Notes",notesStatus_);
            return true;
        }catch(...){notesStatus_=L"Save As failed";MessageBoxW(hwnd_,L"The selected file could not be saved.",L"Trusten Notes",MB_OK|MB_ICONERROR);return false;}
    }
    int notesLineCount() const {
        return 1 + (int)std::count(editor_.text().begin(), editor_.text().end(), L'\n');
    }
    int notesMaxColumns() const {
        int maximum = 0;
        int current = 0;
        for (wchar_t c : editor_.text()) {
            if (c == L'\n') {
                maximum = std::max(maximum, current);
                current = 0;
            } else {
                ++current;
            }
        }
        return std::max(maximum, current);
    }
    int notesCaretColumn() const {
        int column = 0;
        size_t position = editor_.caret();
        while (position > 0 && editor_.text()[position - 1] != L'\n') {
            --position;
            ++column;
        }
        return column;
    }
    int notesVisibleColumns() const {
        auto* window = const_cast<Shell*>(this)->activeWindow();
        if (!window || window->app != AppType::Notes) return 1;
        Rect box = actualBounds(*window);
        return std::max(1, (box.width - 46) / 9);
    }
    int notesCaretLine() const {
        return (int)std::count(editor_.text().begin(), editor_.text().begin() + (ptrdiff_t)editor_.caret(), L'\n');
    }
    int notesVisibleLines() const {
        auto* window = const_cast<Shell*>(this)->activeWindow();
        if (!window || window->app != AppType::Notes) return 1;
        Rect box = actualBounds(*window);
        return std::max(1, (box.height - WINDOW_TITLE_HEIGHT - 57) / 19);
    }
    void clampNotesScroll() {
        notesScrollLine_ = std::clamp(notesScrollLine_, 0, std::max(0, notesLineCount() - notesVisibleLines()));
        notesScrollColumn_ = std::clamp(notesScrollColumn_, 0, std::max(0, notesMaxColumns() - notesVisibleColumns()));
    }
    void revealNotesCaret() {
        int line = notesCaretLine();
        int visible = notesVisibleLines();
        if (line < notesScrollLine_) notesScrollLine_ = line;
        if (line >= notesScrollLine_ + visible) notesScrollLine_ = line - visible + 1;
        int column = notesCaretColumn();
        int columns = notesVisibleColumns();
        if (column < notesScrollColumn_) notesScrollColumn_ = column;
        if (column >= notesScrollColumn_ + columns) notesScrollColumn_ = column - columns + 1;
        clampNotesScroll();
    }
    void scrollNotesHorizontal(int columns) {
        if (auto* window = activeWindow(); window && window->app == AppType::Notes) {
            notesScrollColumn_ += columns;
            clampNotesScroll();
            repaint();
        }
    }
    void scrollNotes(int lines) {
        if (auto* window = activeWindow(); window && window->app == AppType::Notes) {
            notesScrollLine_ += lines;
            clampNotesScroll();
            repaint();
        }
    }
    void keyDown(WPARAM key){
        bool ctrl=(GetKeyState(VK_CONTROL)&0x8000)!=0,alt=(GetKeyState(VK_MENU)&0x8000)!=0;
        if(stage_==Stage::Lock&&(key==VK_RETURN||key==VK_SPACE)){stage_=Stage::Login;keyboard_.visible=layout_.device!=DeviceClass::Desktop;repaint();return;}
        if(stage_==Stage::Login){if(key==VK_RETURN)startSession();else if(key==VK_BACK)handleBackspace();else if(key==VK_F2)keyboard_.visible=!keyboard_.visible;repaint();return;}
        if(stage_!=Stage::Desktop)return;
        if(key==VK_BACK&&(accountModal_||loginField_==2)){handleBackspace();repaint();return;}
        if(key==VK_RETURN&&accountModal_){saveAccount();repaint();return;}
        if(key==VK_RETURN&&loginField_==2){navigateFiles(addressBar_);loginField_=0;repaint();return;}
        if(key==VK_F1||key==VK_LWIN)launcherVisible_=!launcherVisible_;
        else if(key==VK_F2)keyboard_.visible=!keyboard_.visible;
        else if(key==VK_ESCAPE){launcherVisible_=false;shutdownPromptVisible_=false;}
        else if(ctrl&&key=='L'){stage_=Stage::Lock;keyboard_.visible=false;}
        else if(alt&&key>='1'&&key<='9')openWindow((AppType)(key-'1'));
        else if(auto*window=activeWindow()){
            if((window->app==AppType::Assistant||(window->app==AppType::Studio&&studioAiVisible_))&&key==VK_RETURN){sendAi(window->app==AppType::Studio);return;}  
            if(window->app==AppType::Terminal){if(key==VK_RETURN){if(!terminalInput_.empty())terminal_.push_back(L"> "+terminalInput_);terminalInput_.clear();}else if(key==VK_BACK)handleBackspace();}
            else if(window->app==AppType::Notes){if(ctrl&&((GetKeyState(VK_SHIFT)&0x8000)!=0)&&key=='S')saveNotesAs();else if(ctrl&&key=='S')saveNotes();else if(ctrl&&key=='Z')editor_.undo();else if(key==VK_BACK)editor_.backspace();else if(key==VK_RETURN)editor_.insert(L'\n');else if(key==VK_LEFT)editor_.moveLeft();else if(key==VK_RIGHT)editor_.moveRight();else if(key==VK_UP)editor_.moveUp();else if(key==VK_DOWN)editor_.moveDown();else if(key==VK_HOME)editor_.moveHome();else if(key==VK_END)editor_.moveEnd();revealNotesCaret();}
        }
        repaint();
    }
public:
    ~Shell(){if(bootLogo_)DeleteObject(bootLogo_);if(paintBitmap_)DeleteObject(paintBitmap_);mediaCommand(L"close trustenmedia");}
    int run(HINSTANCE instance,int show){
        HRESULT comResult=OleInitialize(nullptr);
        if(FAILED(comResult)){
            MessageBoxW(nullptr,L"COM STA initialization failed.",L"Trusten OS",MB_OK|MB_ICONERROR);
            return 12;
        }
        WNDCLASSEXW wc{};wc.cbSize=sizeof(wc);wc.style=CS_DBLCLKS|CS_HREDRAW|CS_VREDRAW;wc.lpfnWndProc=windowProc;
        wc.hInstance=instance;wc.hCursor=LoadCursorW(nullptr,IDC_ARROW);wc.hbrBackground=(HBRUSH)GetStockObject(BLACK_BRUSH);wc.lpszClassName=L"TrustenOS.GlassDesktop";
        if(!RegisterClassExW(&wc)&&GetLastError()!=ERROR_CLASS_ALREADY_EXISTS)return 10;
        int width=GetSystemMetrics(SM_CXSCREEN),height=GetSystemMetrics(SM_CYSCREEN);
        hwnd_=CreateWindowExW(0,wc.lpszClassName,L"Trusten OS Glass Desktop",WS_POPUP,0,0,width,height,nullptr,nullptr,instance,this);
        if(!hwnd_)return 11;
        SetTimer(hwnd_,TIMER_ANIMATION,16,nullptr);SetTimer(hwnd_,TIMER_SYSTEM,1000,nullptr);
        ShowWindow(hwnd_,show);UpdateWindow(hwnd_);
        MSG message{};while(GetMessageW(&message,nullptr,0,0)>0){TranslateMessage(&message);DispatchMessageW(&message);}OleUninitialize();return(int)message.wParam;
    }
    static Shell* instance(HWND hwnd){return reinterpret_cast<Shell*>(GetWindowLongPtrW(hwnd,GWLP_USERDATA));}
    static LRESULT CALLBACK windowProc(HWND hwnd,UINT message,WPARAM w,LPARAM l){
        if(message==WM_NCCREATE){auto create=(CREATESTRUCTW*)l;auto shell=(Shell*)create->lpCreateParams;shell->hwnd_=hwnd;SetWindowLongPtrW(hwnd,GWLP_USERDATA,(LONG_PTR)shell);}
        auto shell=instance(hwnd);if(!shell)return DefWindowProcW(hwnd,message,w,l);
        switch(message){
            case WM_PAINT:shell->paint();shell->syncWebView();return 0;
            case WM_ERASEBKGND:return 1;
            case WM_SIZE:shell->syncWebView();return 0;
            case WM_TIMER:
                if(w==TIMER_ANIMATION){shell->animationPhase_+=.012;if(shell->stage_==Stage::Startup){shell->startupProgress_=std::min(1.0f,shell->startupProgress_+.012f);if(shell->startupProgress_>=1)shell->stage_=Stage::Lock;}else if(shell->stage_==Stage::Shutdown){shell->shutdownProgress_=std::min(1.0f,shell->shutdownProgress_+.018f);if(shell->shutdownProgress_>=1){if(shell->permissions_.powerControl){if(!shell->performPowerAction(shell->restartRequested_)){MessageBoxW(hwnd,L"The power action could not be completed.",L"Trusten OS",MB_OK|MB_ICONERROR);shell->stage_=Stage::Desktop;shell->shutdownProgress_=0;}}else DestroyWindow(hwnd);}}for(auto&window:shell->windows_)window.openProgress=std::min(1.0f,window.openProgress+.08f);}else{shell->metrics_.update();shell->refreshProcesses();}
                shell->repaint();return 0;
            case WM_LBUTTONDOWN:SetFocus(hwnd);shell->mouseDown({GET_X_LPARAM(l),GET_Y_LPARAM(l)},false);return 0;
            case WM_LBUTTONDBLCLK:shell->mouseDown({GET_X_LPARAM(l),GET_Y_LPARAM(l)},true);return 0;
            case WM_MOUSEMOVE:shell->mouseMove({GET_X_LPARAM(l),GET_Y_LPARAM(l)});return 0;
            case WM_MOUSEWHEEL:
                if (GET_KEYSTATE_WPARAM(w) & MK_SHIFT) shell->scrollNotesHorizontal(GET_WHEEL_DELTA_WPARAM(w)>0?-4:4);
                else shell->scrollNotes(GET_WHEEL_DELTA_WPARAM(w)>0?-3:3);
                return 0;
            case WM_RBUTTONDOWN:{Point p{GET_X_LPARAM(l),GET_Y_LPARAM(l)};shell->taskContext(p);if(!shell->taskMenuVisible_){shell->studioContext(p);if(!shell->studioMenuVisible_)shell->fileContext(p);}return 0;}
            case WM_LBUTTONUP:shell->dragWindowId_=0;shell->resizeWindowId_=0;shell->resizeMask_=ResizeNone;ReleaseCapture();return 0;
            case WM_CHAR:if(w!=8&&w!=13&&w!=9)shell->handleText((wchar_t)w);shell->repaint();return 0;
            case WM_KEYDOWN:shell->keyDown(w);return 0;
            case WM_TRUSTEN_AI_DONE:shell->repaint();return 0;  
            case WM_COPYDATA:{auto data=(COPYDATASTRUCT*)l;if(!data||!data->lpData)return FALSE;if(data->dwData==0x54524E01&&data->cbData>=sizeof(wchar_t)){std::wstring payload((wchar_t*)data->lpData);auto split=payload.find(L'\n');shell->notify(split==std::wstring::npos?L"App notification":payload.substr(0,split),split==std::wstring::npos?payload:payload.substr(split+1));return TRUE;}if(data->dwData==0x54524E02&&data->cbData==sizeof(int)){int app=*(int*)data->lpData;if(app>=0&&app<=16){shell->openWindow((AppType)app);shell->repaint();return TRUE;}}
                if(data->dwData==0x54524E03&&data->cbData>=sizeof(wchar_t)*2){auto buffer=(wchar_t*)data->lpData;std::wstring payload(buffer);auto split=payload.find(L'\n');std::wstring filter=split==std::wstring::npos?std::wstring(L"All files\0*.*\0\0",15):payload.substr(0,split);std::wstring path=split==std::wstring::npos?L"":payload.substr(split+1);if(shell->nativePickFile(hwnd,path,filter.c_str())){wcsncpy(buffer,path.c_str(),data->cbData/sizeof(wchar_t)-1);return TRUE;}return FALSE;}
                if(data->dwData==0x54524E04&&data->cbData>=sizeof(wchar_t)*2){auto buffer=(wchar_t*)data->lpData;std::wstring path(buffer);if(shell->nativePickFolder(hwnd,path)){wcsncpy(buffer,path.c_str(),data->cbData/sizeof(wchar_t)-1);return TRUE;}return FALSE;}
                if(data->dwData==0x54524E05&&data->cbData==sizeof(ULONG_PTR)){HWND child=(HWND)*(ULONG_PTR*)data->lpData;shell->hostSdkWindow(child);return TRUE;}return FALSE;}
            case WM_DESTROY:KillTimer(hwnd,TIMER_ANIMATION);KillTimer(hwnd,TIMER_SYSTEM);PostQuitMessage(0);return 0;
        }
        return DefWindowProcW(hwnd,message,w,l);
    }
};
// namespace trusten

} // namespace trusten

int WINAPI wWinMain(HINSTANCE instance,HINSTANCE,LPWSTR,int show){
    try{
        trusten::Shell shell;
        return shell.run(instance,show);
    }catch(...){
        MessageBoxW(nullptr,L"Trusten OS failed to initialize.",L"Trusten OS",MB_OK|MB_ICONERROR);
        return 1;
    }
}
'''


DEFAULT_STARTNET = r'''@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Trusten OS Boot
wpeinit
set "BOOTDRIVE="
for %%D in (C D E F G H I J K L M N O P Q R S T U V W X Y Z) do (
  if exist "%%D:\apps\{{MAIN_EXE}}" set "BOOTDRIVE=%%D:"
)
if not defined BOOTDRIVE (
  color 0C
  echo [FATAL] Trusten main executable was not found.
  echo Expected: ^<drive^>:\apps\{{MAIN_EXE}}
  echo.
  for %%D in (C D E F G H I J K L M N O P Q R S T U V W X Y Z) do if exist "%%D:\" echo Detected drive %%D:
  cmd /k
  exit /b 2
)
set "PATH=%BOOTDRIVE%\apps;%BOOTDRIVE%\mingw\bin;%PATH%"
cd /d "%BOOTDRIVE%\apps"
echo [Trusten] Boot drive: %BOOTDRIVE%
echo [Trusten] Starting %BOOTDRIVE%\apps\{{MAIN_EXE}}
:ShellLoop
"%BOOTDRIVE%\apps\{{MAIN_EXE}}"
set "RC=!ERRORLEVEL!"
echo [Trusten] main.exe exit code: !RC!
timeout /t 3 /nobreak >nul
goto ShellLoop
'''


README_TEXT = r'''Custom WinPE ISO Overlay

Files in this folder are copied to the root of the WinPE ISO.

Compiled C++ programs are copied to:
\apps

If enabled, the full MinGW compiler/toolchain is copied to:
\mingw

If enabled, project source files are copied to:
\project_src

The boot script starts the selected main EXE from:
\apps
'''


def is_admin():
    try:
        return bool(ctypes.windll.shell32.IsUserAnAdmin())
    except Exception:
        return False


def ensure_admin_or_relaunch():
    if is_admin():
        return

    script_path = Path(__file__).resolve()

    try:
        result = ctypes.windll.shell32.ShellExecuteW(
            None,
            "runas",
            sys.executable,
            f'"{script_path}"',
            str(script_path.parent),
            1
        )

        if result <= 32:
            root = tk.Tk()
            root.withdraw()
            messagebox.showerror(
                "Administrator permission needed",
                "Windows did not grant Administrator permission.\n\n"
                "The builder needs admin permission for DISM mounting."
            )
            root.destroy()

        raise SystemExit

    except SystemExit:
        raise

    except Exception as e:
        root = tk.Tk()
        root.withdraw()
        messagebox.showerror(
            "Administrator relaunch failed",
            f"Could not request Administrator permission:\n\n{e}"
        )
        root.destroy()
        raise SystemExit


def ensure_project():
    SRC_DIR.mkdir(parents=True, exist_ok=True)
    ISO_OVERLAY_DIR.mkdir(parents=True, exist_ok=True)
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    BUILD_TEMP_DIR.mkdir(parents=True, exist_ok=True)
    ADK_TEMP_DIR.mkdir(parents=True, exist_ok=True)
    DISM_SCRATCH_DIR.mkdir(parents=True, exist_ok=True)
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    WEB_ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    CEF_DIST_DIR.mkdir(parents=True, exist_ok=True)

    main_cpp = SRC_DIR / "main.cpp"

    if not main_cpp.exists():
        main_cpp.write_text(DEFAULT_CPP, encoding="utf-8")

    BOOT_SCRIPT_FILE.write_text(DEFAULT_STARTNET, encoding="utf-8")

    readme = ISO_OVERLAY_DIR / "README.txt"

    if not readme.exists():
        readme.write_text(README_TEXT, encoding="utf-8")


def force_writable(path):
    try:
        path = Path(path)
        if path.exists():
            os.chmod(path, stat.S_IWRITE | stat.S_IREAD | stat.S_IEXEC)
    except Exception:
        pass


def rmtree_onerror(func, path, exc_info):
    try:
        force_writable(path)
        func(path)
    except Exception:
        pass


def safe_rmtree(path):
    path = Path(path)

    if not path.exists():
        return

    try:
        shutil.rmtree(path, onerror=rmtree_onerror)
    except Exception:
        # Second pass: manually clear attributes, then retry.
        for root, dirs, files in os.walk(path, topdown=False):
            for name in files:
                force_writable(Path(root) / name)
            for name in dirs:
                force_writable(Path(root) / name)

        force_writable(path)
        shutil.rmtree(path, onerror=rmtree_onerror)


def create_tool_env(temp_dir):
    temp_dir = Path(temp_dir)
    temp_dir.mkdir(parents=True, exist_ok=True)

    env = os.environ.copy()
    env["TEMP"] = str(temp_dir)
    env["TMP"] = str(temp_dir)
    env["TMPDIR"] = str(temp_dir)

    return env


def create_build_env():
    return create_tool_env(BUILD_TEMP_DIR)


def create_adk_env(copype_path, oscdimg_path):
    env = create_tool_env(ADK_TEMP_DIR)

    winpe_root = Path(copype_path).parent
    oscdimg_root = Path(oscdimg_path).parent

    env["WinPERoot"] = str(winpe_root)
    env["OSCDImgRoot"] = str(oscdimg_root)

    path_parts = [
        env.get("Path", ""),
        r"C:\Windows\System32",
        str(oscdimg_root),
    ]

    env["Path"] = ";".join(path_parts)

    return env


def run_command(cmd, log_func, cwd=None, env=None):
    pretty = " ".join(f'"{str(x)}"' if " " in str(x) else str(x) for x in cmd)
    log_func("\n> " + pretty)

    proc = subprocess.Popen(
        cmd,
        cwd=cwd,
        env=env,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        shell=False
    )

    lines = []

    if proc.stdout:
        for line in proc.stdout:
            lines.append(line)
            log_func(line.rstrip())

    code = proc.wait()
    output = "".join(lines)

    if code != 0:
        raise RuntimeError(f"Command failed with exit code {code}\n\n{output}")

    return output


def run_dism(cmd_args, log_func, env=None, log_name="dism.log"):
    DISM_SCRATCH_DIR.mkdir(parents=True, exist_ok=True)
    LOG_DIR.mkdir(parents=True, exist_ok=True)

    dism_log = LOG_DIR / log_name

    cmd = [
        "dism",
        f"/ScratchDir:{DISM_SCRATCH_DIR}",
        f"/LogPath:{dism_log}",
    ] + cmd_args

    return run_command(cmd, log_func, env=env)


def find_in_path(names):
    for name in names:
        found = shutil.which(name)

        if found:
            return Path(found)

    return None


def find_file_under(root, names, max_depth=14):
    root = Path(root)

    if not root.exists():
        return None

    root_depth = len(root.parts)

    for current, dirs, files in os.walk(root):
        current_path = Path(current)

        if len(current_path.parts) - root_depth > max_depth:
            dirs[:] = []
            continue

        lower_files = {f.lower(): f for f in files}

        for name in names:
            if name.lower() in lower_files:
                return current_path / lower_files[name.lower()]

    return None


def find_adk_tool(tool_name):
    direct = find_in_path([tool_name])

    if direct:
        return direct

    roots = [
        Path(r"C:\Program Files (x86)\Windows Kits\10"),
        Path(r"C:\Program Files (x86)\Windows Kits\11"),
    ]

    for root in roots:
        found = find_file_under(root, [tool_name], max_depth=14)

        if found:
            return found

    return None


def find_compiler():
    cl = find_in_path(["cl.exe", "cl"])

    if cl:
        return "msvc", cl

    gpp = find_in_path(["g++.exe", "g++"])

    if gpp:
        return "mingw", gpp

    return None, None


def find_mingw_root(gpp_path):
    if not gpp_path:
        return None

    gpp_path = Path(gpp_path).resolve()

    if gpp_path.parent.name.lower() == "bin":
        return gpp_path.parent.parent

    return gpp_path.parent


def validate_boot_script(text):
    errors = []

    if not text.strip():
        errors.append("startnet.cmd is empty.")

    if "wpeinit" not in text.lower():
        errors.append("startnet.cmd should call wpeinit.")

    if "{{MAIN_EXE}}" not in text:
        errors.append("startnet.cmd must include {{MAIN_EXE}}.")

    if text.count('"') % 2 != 0:
        errors.append("startnet.cmd has an uneven number of quotes.")

    return errors


def write_copy_warning(message):
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    warning_log = LOG_DIR / "copy_warnings.log"

    with warning_log.open("a", encoding="utf-8", errors="replace") as f:
        f.write(str(message) + "\n")


def copy_file_resilient(src, dst, log_func=None):
    src = Path(src)
    dst = Path(dst)
    dst.parent.mkdir(parents=True, exist_ok=True)

    try:
        if dst.exists():
            force_writable(dst)

        shutil.copy2(src, dst)
        force_writable(dst)
        return True

    except PermissionError as e:
        # Retry using copyfile only, avoiding metadata copy.
        try:
            if dst.exists():
                force_writable(dst)

            shutil.copyfile(src, dst)
            force_writable(dst)

            msg = f"Copied without metadata because of permission issue: {src} -> {dst}"
            write_copy_warning(msg)
            if log_func:
                log_func("Copy warning: " + msg)
            return True

        except Exception as e2:
            msg = f"Skipped locked/blocked file: {src} -> {dst} | {e2}"
            write_copy_warning(msg)
            if log_func:
                log_func("Copy warning: " + msg)
            return False

    except Exception as e:
        msg = f"Skipped copy error: {src} -> {dst} | {e}"
        write_copy_warning(msg)
        if log_func:
            log_func("Copy warning: " + msg)
        return False


def copy_tree_resilient(src, dst, log_func=None):
    src = Path(src)
    dst = Path(dst)

    copied = 0
    skipped = 0

    if not src.exists():
        return copied, skipped

    dst.mkdir(parents=True, exist_ok=True)

    for root, dirs, files in os.walk(src):
        root_path = Path(root)

        try:
            rel_root = root_path.relative_to(src)
        except ValueError:
            rel_root = Path(".")

        dst_root = dst / rel_root
        dst_root.mkdir(parents=True, exist_ok=True)

        for dirname in dirs:
            target_dir = dst_root / dirname
            try:
                target_dir.mkdir(parents=True, exist_ok=True)
                force_writable(target_dir)
            except Exception as e:
                skipped += 1
                msg = f"Skipped directory create: {target_dir} | {e}"
                write_copy_warning(msg)
                if log_func:
                    log_func("Copy warning: " + msg)

        for filename in files:
            src_file = root_path / filename
            dst_file = dst_root / filename

            if copy_file_resilient(src_file, dst_file, log_func=log_func):
                copied += 1
            else:
                skipped += 1

    return copied, skipped


def copy_tree_contents(src, dst, log_func=None):
    src = Path(src)
    dst = Path(dst)
    dst.mkdir(parents=True, exist_ok=True)

    if not src.exists():
        return 0, 0

    total_copied = 0
    total_skipped = 0

    for item in src.iterdir():
        target = dst / item.name

        if item.is_dir():
            if target.exists():
                safe_rmtree(target)

            copied, skipped = copy_tree_resilient(item, target, log_func=log_func)
            total_copied += copied
            total_skipped += skipped

        else:
            if copy_file_resilient(item, target, log_func=log_func):
                total_copied += 1
            else:
                total_skipped += 1

    return total_copied, total_skipped


def copy_selected_project_source(dst, log_func=None):
    dst = Path(dst)
    dst.mkdir(parents=True, exist_ok=True)

    total_copied = 0
    total_skipped = 0

    items_to_copy = [
        SRC_DIR,
        ISO_OVERLAY_DIR,
        BOOT_SCRIPT_FILE,
    ]

    for item in items_to_copy:
        if not item.exists():
            continue

        target = dst / item.name

        if item.is_dir():
            if target.exists():
                safe_rmtree(target)

            copied, skipped = copy_tree_resilient(item, target, log_func=log_func)
            total_copied += copied
            total_skipped += skipped

        else:
            if copy_file_resilient(item, target, log_func=log_func):
                total_copied += 1
            else:
                total_skipped += 1

    return total_copied, total_skipped


def count_files_and_size(folder):
    folder = Path(folder)
    count = 0
    total = 0

    if not folder.exists():
        return count, total

    for root, dirs, files in os.walk(folder):
        for name in files:
            path = Path(root) / name

            try:
                count += 1
                total += path.stat().st_size
            except OSError:
                pass

    return count, total


def format_size(num_bytes):
    size = float(num_bytes)
    units = ["B", "KB", "MB", "GB", "TB"]

    for unit in units:
        if size < 1024.0:
            return f"{size:.2f} {unit}"
        size /= 1024.0

    return f"{size:.2f} PB"


def make_relative_file_list(root):
    root = Path(root)
    lines = []

    if not root.exists():
        return lines

    for current, dirs, files in os.walk(root):
        current_path = Path(current)

        for name in sorted(files):
            path = current_path / name

            try:
                rel = path.relative_to(root)
            except ValueError:
                rel = path

            try:
                size = path.stat().st_size
            except OSError:
                size = 0

            lines.append(f"{rel}    {format_size(size)}")

    return lines


def find_cef_distribution():
    root = PROJECT_DIR / "cef" / "distribution"
    choices = sorted(
        [p for p in root.glob("cef_binary_*_windows64") if p.is_dir()],
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    if not choices:
        raise RuntimeError(f"CEF Windows x64 distribution missing under {root}")
    return choices[0]

def package_complete_cef(media_dir, apps_dir, log_func):
    dist = find_cef_distribution()
    release = dist / "Release"
    resources = dist / "Resources"
    if not release.is_dir() or not resources.is_dir():
        raise RuntimeError(f"Incomplete CEF distribution: {dist}")

    log_func("")
    log_func("Packaging CEF Release beside main.exe...")
    release_copied, release_skipped = copy_tree_contents(release, apps_dir, log_func)

    cef_dst = Path(media_dir) / "cef"
    if cef_dst.exists():
        safe_rmtree(cef_dst)
    log_func("Packaging complete CEF Resources tree to \\cef...")
    resource_copied, resource_skipped = copy_tree_contents(resources, cef_dst, log_func)

    required_apps = (
        "main.exe", "libcef.dll", "chrome_elf.dll", "libEGL.dll",
        "libGLESv2.dll", "vulkan-1.dll", "vk_swiftshader.dll",
        "vk_swiftshader_icd.json", "v8_context_snapshot.bin",
    )
    required_resources = (
        "icudtl.dat", "resources.pak", "chrome_100_percent.pak",
        "chrome_200_percent.pak",
    )
    missing = [f"apps\\{n}" for n in required_apps if not (Path(apps_dir) / n).is_file()]
    missing += [f"cef\\{n}" for n in required_resources if not (cef_dst / n).is_file()]
    if not (cef_dst / "locales").is_dir() or not any((cef_dst / "locales").glob("*.pak")):
        missing.append("cef\\locales\\*.pak")
    if missing:
        raise RuntimeError("CEF package incomplete:\n- " + "\n- ".join(missing))

    ac, az = count_files_and_size(apps_dir)
    rc, rz = count_files_and_size(cef_dst)
    log_func(f"CEF Release: {release_copied} copied, {release_skipped} skipped")
    log_func(f"CEF Resources: {resource_copied} copied, {resource_skipped} skipped")
    log_func(f"\\apps: {ac} files, {format_size(az)}")
    log_func(f"\\cef: {rc} files, {format_size(rz)}")
    return release_skipped + resource_skipped

def validate_complete_os_tree(media_dir, apps_dir, mingw_dst, log_func):
    required = [
        Path(media_dir) / "sources" / "boot.wim",
        Path(media_dir) / "bootmgr",
        Path(apps_dir) / "main.exe",
        Path(mingw_dst) / "bin" / "g++.exe",
    ]
    missing = [str(path) for path in required if not path.exists()]
    if missing:
        raise RuntimeError("Native release package validation failed:\n- " + "\n- ".join(missing))
    count, total = count_files_and_size(media_dir)
    log_func(f"Validated native release OS tree: {count} files, {format_size(total)} before ISO compression")

def validate_complete_tree(media_dir, apps_dir, mingw_dst):
    required = [
        Path(media_dir) / "sources" / "boot.wim",
        Path(media_dir) / "bootmgr",
        Path(apps_dir) / "main.exe",
        Path(mingw_dst) / "bin" / "g++.exe",
    ]
    missing = [str(path) for path in required if not path.exists()]
    if missing:
        raise RuntimeError("Incomplete native release tree:\n- " + "\n- ".join(missing))

def build_final_startnet(boot_text, main_exe_name, include_mingw, include_webview2=False):
    mingw_line = ""

    if include_mingw:
        mingw_line = (
            f'set "PATH=%BOOTDRIVE%\\{COMPILED_DIR_NAME};'
            f'%BOOTDRIVE%\\{MINGW_DIR_NAME}\\bin;%PATH%"'
        )

    final_text = boot_text.replace("{{MAIN_EXE}}", main_exe_name)
    if include_webview2:
        install_line = r'if exist "%BOOTDRIVE%\webview2_runtime\MicrosoftEdgeWebView2RuntimeInstallerX64.exe" "%BOOTDRIVE%\webview2_runtime\MicrosoftEdgeWebView2RuntimeInstallerX64.exe" /silent /install'
        final_text = final_text.replace("wpeinit", "wpeinit\n" + install_line, 1)

    if "{{MINGW_PATH_LINE}}" in final_text:
        final_text = final_text.replace("{{MINGW_PATH_LINE}}", mingw_line)
        return final_text

    if not include_mingw:
        return final_text

    lines = final_text.splitlines()
    output = []
    inserted = False

    for line in lines:
        output.append(line)

        if not inserted and line.strip().lower() == "wpeinit":
            output.append("")
            output.append(mingw_line)
            inserted = True

    if not inserted:
        output.insert(0, mingw_line)

    return "\n".join(output) + "\n"


def newest_version_dir(paths):
    candidates = []
    for base in paths:
        base = Path(os.path.expandvars(str(base)))
        if not base.exists():
            continue
        try:
            for child in base.iterdir():
                if child.is_dir():
                    parts = tuple(int(x) if x.isdigit() else 0 for x in child.name.split("."))
                    candidates.append((parts, child))
        except OSError:
            pass
    return max(candidates, default=((), None), key=lambda item: item[0])[1]

def discover_web_assets():
    for root in [WEB_ASSETS_DIR, PROJECT_DIR / "wwwroot", PROJECT_DIR / "assets" / "web", SRC_DIR / "web", ISO_OVERLAY_DIR / "web"]:
        if (root / "index.html").exists():
            return root
    return None

def webview2_package_paths():
    native = WEBVIEW2_PACKAGE_DIR / "build" / "native"
    return {
        "header": native / "include" / "WebView2.h",
        "include": native / "include",
        "loader_dll": native / "x64" / "WebView2Loader.dll",
        "loader_static": native / "x64" / "WebView2LoaderStatic.lib",
        "runtime_installer": WEBVIEW2_RUNTIME_DIR / "MicrosoftEdgeWebView2RuntimeInstallerX64.exe",
    }

def validate_webview2_package():
    paths = webview2_package_paths()
    errors = [f"Missing {name}: {path}" for name, path in paths.items() if name != "include" and not path.is_file()]
    return errors, paths

def download_latest_webview2_x64(log_func=None):
    try:
        WEBVIEW2_DIR.mkdir(parents=True, exist_ok=True)
        if log_func: log_func("Reading official Microsoft.Web.WebView2 versions...")
        with urllib.request.urlopen(WEBVIEW2_NUGET_INDEX, timeout=90) as response:
            versions = json.loads(response.read().decode("utf-8")).get("versions", [])
        stable = [v for v in versions if "-" not in v]
        if not stable: raise RuntimeError("No stable WebView2 SDK version was listed.")
        version = max(stable, key=lambda v: tuple(int(x) if x.isdigit() else 0 for x in v.split(".")))
        package = WEBVIEW2_DIR / f"Microsoft.Web.WebView2.{version}.nupkg"
        url = f"{WEBVIEW2_NUGET_BASE}/{version}/microsoft.web.webview2.{version}.nupkg"
        if log_func: log_func(f"Downloading WebView2 SDK {version}...")
        urllib.request.urlretrieve(url, package)
        safe_rmtree(WEBVIEW2_PACKAGE_DIR); WEBVIEW2_PACKAGE_DIR.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(package) as archive:
            destination = WEBVIEW2_PACKAGE_DIR.resolve()
            for member in archive.infolist():
                target = (destination / member.filename).resolve()
                if destination not in target.parents and target != destination:
                    raise RuntimeError(f"Unsafe package member: {member.filename}")
            archive.extractall(destination)
        package.unlink(missing_ok=True)
        WEBVIEW2_RUNTIME_DIR.mkdir(parents=True, exist_ok=True)
        if log_func: log_func("Downloading WebView2 Evergreen Standalone x64 Runtime...")
        urllib.request.urlretrieve(WEBVIEW2_RUNTIME_X64_URL, webview2_package_paths()["runtime_installer"])
        errors, paths = validate_webview2_package()
        if errors: raise RuntimeError("\n".join(errors))
        if log_func: log_func("WebView2 SDK and runtime are ready.")
        return paths
    except Exception as error:
        if log_func: log_func(f"WebView2 download failed: {error}")
        return None

def download_latest_cef_windows64(log_func=None):
    try:
        if log_func: log_func("Reading official CEF build index...")
        with urllib.request.urlopen(CEF_BUILDS_INDEX, timeout=90) as response:
            index = json.loads(response.read().decode("utf-8"))
        versions = index.get("windows64", {}).get("versions", [])
        candidates = []
        for version in versions:
            for item in version.get("files", []):
                name = item.get("name", "")
                lower_name = name.lower()
                unstable = any(tag in lower_name for tag in ("_beta", "_alpha", "_dev", "_canary"))
                if not unstable and item.get("type") in ("standard", "minimal") and name.endswith(".tar.bz2"):
                    priority = 0 if item.get("type") == "standard" else 1
                    candidates.append((priority, version.get("cef_version", ""), item))
        if not candidates: raise RuntimeError("No stable Windows 64-bit CEF development build was listed.")
        candidates.sort(key=lambda row: row[0])
        _, version, item = candidates[0]
        archive = CEF_DIR / item["name"]
        CEF_DIR.mkdir(parents=True, exist_ok=True)
        if log_func: log_func(f"Downloading official stable CEF x64 build {version}...")
        urllib.request.urlretrieve(CEF_BUILDS_BASE + item["name"], archive)
        safe_rmtree(CEF_DIST_DIR); CEF_DIST_DIR.mkdir(parents=True, exist_ok=True)
        with tarfile.open(archive, "r:bz2") as package: package.extractall(CEF_DIST_DIR, filter="data")
        archive.unlink(missing_ok=True)
        assemble_cef_runtime()
        errors, runtime_root = validate_cef_distribution()
        if errors: raise RuntimeError("; ".join(errors))
        if log_func: log_func(f"CEF staged successfully. Runtime: {runtime_root}")
        return runtime_root
    except Exception as error:
        if log_func: log_func(f"CEF download failed: {error}")
        return None

def assemble_cef_runtime():
    distribution = cef_distribution_root()
    if not distribution:
        raise RuntimeError("CEF development root was not found after extraction.")
    release = distribution / "Release"
    resources = distribution / "Resources"
    if not release.exists():
        raise RuntimeError(f"Missing CEF Release directory: {release}")
    if not resources.exists():
        raise RuntimeError(f"Missing CEF Resources directory: {resources}")
    safe_rmtree(CEF_RUNTIME_STAGE_DIR)
    CEF_RUNTIME_STAGE_DIR.mkdir(parents=True, exist_ok=True)
    copied_release, skipped_release = copy_tree_contents(release, CEF_RUNTIME_STAGE_DIR)
    copied_resources, skipped_resources = copy_tree_contents(resources, CEF_RUNTIME_STAGE_DIR)
    skipped = skipped_release + skipped_resources
    if skipped:
        raise RuntimeError(f"CEF runtime assembly skipped {skipped} files.")
    return CEF_RUNTIME_STAGE_DIR, copied_release + copied_resources

def validate_cef_distribution():
    distribution = cef_distribution_root()
    errors = []
    if not distribution:
        return ["Missing CEF development root with include/capi/cef_app_capi.h"], None
    if not (distribution / "Release" / "libcef.lib").exists():
        errors.append("Missing Release/libcef.lib required to link the CEF shell")
    root = CEF_RUNTIME_STAGE_DIR
    if not root.exists():
        try:
            root, _ = assemble_cef_runtime()
        except Exception as error:
            errors.append(str(error))
            return errors, None
    for name in ["libcef.dll", "chrome_elf.dll", "icudtl.dat", "resources.pak"]:
        if not (root / name).exists():
            errors.append(f"Missing assembled CEF runtime file: {name}")
    locales = root / "locales"
    if not locales.exists() or not any(locales.glob("*.pak")):
        errors.append("Missing assembled CEF locales folder or locale .pak files")
    return errors, root

def cef_distribution_root():
    if not CEF_DIST_DIR.exists():
        return None
    for capi_file in CEF_DIST_DIR.rglob("cef_app_capi.h"):
        root = capi_file.parents[2]
        if (root / "include" / "capi" / "cef_app_capi.h").exists():
            return root
    return None

def stage_webview2_into_iso(apps_dir, media_dir, log_func):
    errors, paths = validate_webview2_package()
    if errors:
        paths = download_latest_webview2_x64(log_func)
        if not paths:
            raise RuntimeError("WebView2 package could not be staged.")
    loader_target = Path(apps_dir) / "WebView2Loader.dll"
    shutil.copy2(paths["loader_dll"], loader_target)
    runtime_dir = Path(media_dir) / "webview2_runtime"
    safe_rmtree(runtime_dir)
    runtime_dir.mkdir(parents=True, exist_ok=True)
    installer_target = runtime_dir / paths["runtime_installer"].name
    shutil.copy2(paths["runtime_installer"], installer_target)
    # Preserve all SDK-provided x64 native DLLs, if Microsoft adds more in a future package.
    copied = {loader_target.name}
    for base in (WEBVIEW2_PACKAGE_DIR / "build" / "native" / "x64", WEBVIEW2_PACKAGE_DIR / "runtimes" / "win-x64" / "native"):
        if base.exists():
            for dll in base.rglob("*.dll"):
                target = Path(apps_dir) / dll.name
                shutil.copy2(dll, target)
                copied.add(target.name)
    installer_size = installer_target.stat().st_size
    if installer_size < 10 * 1024 * 1024:
        raise RuntimeError(f"WebView2 runtime installer is unexpectedly small: {installer_size} bytes")
    if not loader_target.is_file():
        raise RuntimeError("WebView2Loader.dll was not copied beside main.exe.")
    log_func("WebView2 native DLLs: " + ", ".join(sorted(copied)))
    log_func(f"WebView2 offline runtime added: {installer_target} ({format_size(installer_size)})")
    return loader_target, installer_target

class BuilderApp:
    def __init__(self, root):
        self.root = root
        self.root.title(APP_TITLE)
        self.root.geometry("1180x760")
        self.root.minsize(980, 620)

        self.current_cpp_file = None
        self.current_iso_file = None

        self.include_full_mingw_var = tk.BooleanVar(value=True)
        self.include_project_source_var = tk.BooleanVar(value=True)
        self.clean_work_before_build_var = tk.BooleanVar(value=True)
        self.clean_temp_before_build_var = tk.BooleanVar(value=True)
        self.include_web_assets_var = tk.BooleanVar(value=True)
        self.include_cef_var = tk.BooleanVar(value=True)

        ensure_project()
        self.build_ui()
        self.refresh_all()

    def build_ui(self):
        main = ttk.Frame(self.root)
        main.pack(fill="both", expand=True)

        top = ttk.Frame(main)
        top.pack(fill="x", padx=8, pady=6)

        ttk.Button(top, text="Refresh", command=self.refresh_all).pack(side="left", padx=4)
        ttk.Button(top, text="Build ISO", command=self.start_build_thread).pack(side="left", padx=4)
        ttk.Button(top, text="Open Project", command=self.open_project_folder).pack(side="left", padx=4)
        ttk.Button(top, text="Open Out", command=self.open_out_folder).pack(side="left", padx=4)
        ttk.Button(top, text="Open Temp", command=self.open_temp_folder).pack(side="left", padx=4)
        ttk.Button(top, text="Open Logs", command=self.open_logs_folder).pack(side="left", padx=4)

        ttk.Label(
            top,
            text="Admin: YES" if is_admin() else "Admin: NO",
            foreground="green" if is_admin() else "red"
        ).pack(side="right", padx=8)

        self.notebook = ttk.Notebook(main)
        self.notebook.pack(fill="both", expand=True, padx=8, pady=8)

        self.build_cpp_tab()
        self.build_boot_tab()
        self.build_iso_tab()
        self.build_libraries_tab()
        self.build_cef_tab()
        self.build_options_tab()
        self.build_log_tab()

    def build_cpp_tab(self):
        tab = ttk.Frame(self.notebook)
        self.notebook.add(tab, text="C++ Source")

        left = ttk.Frame(tab, width=260)
        left.pack(side="left", fill="y", padx=6, pady=6)
        left.pack_propagate(False)

        right = ttk.Frame(tab)
        right.pack(side="right", fill="both", expand=True, padx=6, pady=6)

        ttk.Label(left, text="C++ files").pack(anchor="w")

        self.cpp_list = tk.Listbox(left)
        self.cpp_list.pack(fill="both", expand=True)
        self.cpp_list.bind("<<ListboxSelect>>", self.on_cpp_select)

        ttk.Button(left, text="New .cpp", command=self.new_cpp_file).pack(fill="x", pady=2)
        ttk.Button(left, text="Delete .cpp", command=self.delete_cpp_file).pack(fill="x", pady=2)

        ttk.Label(right, text="Editor").pack(anchor="w")

        self.cpp_editor = tk.Text(right, wrap="none", undo=True)
        self.cpp_editor.pack(fill="both", expand=True)

        ttk.Button(right, text="Save C++", command=self.save_cpp_file).pack(anchor="e", pady=6)

    def build_boot_tab(self):
        tab = ttk.Frame(self.notebook)
        self.notebook.add(tab, text="startnet.cmd")

        ttk.Label(
            tab,
            text="This script runs inside WinPE. Keep wpeinit and {{MAIN_EXE}}. Optional placeholder: {{MINGW_PATH_LINE}}."
        ).pack(anchor="w", padx=8, pady=6)

        self.boot_editor = tk.Text(tab, wrap="none", undo=True)
        self.boot_editor.pack(fill="both", expand=True, padx=8, pady=6)

        bottom = ttk.Frame(tab)
        bottom.pack(fill="x", padx=8, pady=6)

        ttk.Button(bottom, text="Save startnet.cmd", command=self.save_boot_script).pack(side="right", padx=4)
        ttk.Button(bottom, text="Reset Default", command=self.reset_boot_script).pack(side="right", padx=4)

    def build_iso_tab(self):
        tab = ttk.Frame(self.notebook)
        self.notebook.add(tab, text="ISO Overlay")

        left = ttk.Frame(tab, width=320)
        left.pack(side="left", fill="y", padx=6, pady=6)
        left.pack_propagate(False)

        right = ttk.Frame(tab)
        right.pack(side="right", fill="both", expand=True, padx=6, pady=6)

        ttk.Label(left, text="ISO overlay files").pack(anchor="w")

        tree_frame = ttk.Frame(left)
        tree_frame.pack(fill="both", expand=True)

        self.iso_tree = ttk.Treeview(tree_frame)
        self.iso_tree.pack(side="left", fill="both", expand=True)
        self.iso_tree.bind("<<TreeviewSelect>>", self.on_iso_select)

        scroll = ttk.Scrollbar(tree_frame, orient="vertical", command=self.iso_tree.yview)
        scroll.pack(side="right", fill="y")
        self.iso_tree.configure(yscrollcommand=scroll.set)

        ttk.Button(left, text="New Text File", command=self.new_iso_file).pack(fill="x", pady=2)
        ttk.Button(left, text="Import File", command=self.import_iso_file).pack(fill="x", pady=2)
        ttk.Button(left, text="Import Folder", command=self.import_iso_folder).pack(fill="x", pady=2)
        ttk.Button(left, text="Delete Selected", command=self.delete_iso_selected).pack(fill="x", pady=2)

        ttk.Label(right, text="Text file editor").pack(anchor="w")

        self.iso_editor = tk.Text(right, wrap="none", undo=True)
        self.iso_editor.pack(fill="both", expand=True)

        ttk.Button(right, text="Save ISO File", command=self.save_iso_file).pack(anchor="e", pady=6)

    def build_libraries_tab(self):
        tab = ttk.Frame(self.notebook)
        self.notebook.add(tab, text="Compiler Libraries")

        ttk.Label(
            tab,
            text=("Paste linker libraries below before building. Use one library or flag per line. "
                  "The defaults include -luuid/uuid.lib for Windows known-folder GUIDs.")
        ).pack(anchor="w", padx=10, pady=(10, 6))

        panes = ttk.Panedwindow(tab, orient="horizontal")
        panes.pack(fill="both", expand=True, padx=10, pady=6)

        mingw_frame = ttk.Labelframe(panes, text="MinGW libraries / linker flags")
        msvc_frame = ttk.Labelframe(panes, text="MSVC libraries / linker flags")
        panes.add(mingw_frame, weight=1)
        panes.add(msvc_frame, weight=1)

        self.mingw_lib_editor = tk.Text(mingw_frame, wrap="none", undo=True)
        self.mingw_lib_editor.pack(fill="both", expand=True, padx=6, pady=6)
        self.msvc_lib_editor = tk.Text(msvc_frame, wrap="none", undo=True)
        self.msvc_lib_editor.pack(fill="both", expand=True, padx=6, pady=6)

        buttons = ttk.Frame(tab)
        buttons.pack(fill="x", padx=10, pady=(0, 10))
        ttk.Button(buttons, text="Save Libraries", command=self.save_library_config).pack(side="right", padx=4)
        ttk.Button(buttons, text="Reset Defaults", command=self.reset_library_config).pack(side="right", padx=4)
        self.load_library_config()

    def load_library_config(self):
        mingw = DEFAULT_MINGW_LIBRARIES
        msvc = DEFAULT_MSVC_LIBRARIES
        if LIBRARY_CONFIG_FILE.exists():
            text = LIBRARY_CONFIG_FILE.read_text(encoding="utf-8", errors="replace")
            section = None
            values = {"mingw": [], "msvc": []}
            for raw in text.splitlines():
                line = raw.strip()
                if line.lower() == "[mingw]":
                    section = "mingw"
                elif line.lower() == "[msvc]":
                    section = "msvc"
                elif section and line and not line.startswith("#"):
                    values[section].append(line)
            if values["mingw"]:
                mingw = "\n".join(values["mingw"])
            if values["msvc"]:
                msvc = "\n".join(values["msvc"])
        self.mingw_lib_editor.delete("1.0", "end")
        self.mingw_lib_editor.insert("1.0", mingw)
        self.msvc_lib_editor.delete("1.0", "end")
        self.msvc_lib_editor.insert("1.0", msvc)

    def save_library_config(self, show_message=True):
        mingw = self.mingw_lib_editor.get("1.0", "end-1c").strip()
        msvc = self.msvc_lib_editor.get("1.0", "end-1c").strip()
        text = "[mingw]\n" + mingw + "\n\n[msvc]\n" + msvc + "\n"
        LIBRARY_CONFIG_FILE.write_text(text, encoding="utf-8")
        if show_message:
            messagebox.showinfo("Saved", "Compiler library lists saved.")

    def reset_library_config(self):
        self.mingw_lib_editor.delete("1.0", "end")
        self.mingw_lib_editor.insert("1.0", DEFAULT_MINGW_LIBRARIES)
        self.msvc_lib_editor.delete("1.0", "end")
        self.msvc_lib_editor.insert("1.0", DEFAULT_MSVC_LIBRARIES)
        self.save_library_config(show_message=False)

    @staticmethod
    def parse_library_lines(text):
        result = []
        for raw in text.splitlines():
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            result.extend(line.split())
        return result

    def replace_folder_from_dialog(self, title, destination):
        source = filedialog.askdirectory(title=title)
        if not source:
            return
        source = Path(source)
        if destination.exists():
            safe_rmtree(destination)
        copied, skipped = copy_tree_resilient(source, destination, log_func=None)
        messagebox.showinfo("Imported", f"Copied {copied} files. Skipped {skipped} files.\n\nDestination:\n{destination}")

    def stage_cef(self):
        result = download_latest_cef_windows64(self.log)
        self.validate_cef_ui()
        messagebox.showinfo("CEF", f"CEF staged at:\n{result}" if result else "CEF download failed. See Build Log.")

    def import_cef_folder(self):
        self.replace_folder_from_dialog("Select extracted CEF Windows x64 Standard Distribution", CEF_DIST_DIR)
        try:
            assemble_cef_runtime()
        except Exception as error:
            messagebox.showerror("CEF", str(error))
        self.validate_cef_ui()

    def validate_cef_ui(self):
        errors, runtime = validate_cef_distribution()
        distribution = cef_distribution_root()
        lines = [
            "Chromium Embedded Framework x64",
            "",
            f"Distribution: {distribution or 'NOT FOUND'}",
            f"Runtime stage: {runtime or 'NOT FOUND'}",
            "",
            "READY" if not errors else "PROBLEMS:\n- " + "\n- ".join(errors),
        ]
        self.cef_status.configure(state="normal")
        self.cef_status.delete("1.0", "end")
        self.cef_status.insert("1.0", "\n".join(lines))
        self.cef_status.configure(state="disabled")
        return not errors

    def build_cef_tab(self):
        tab = ttk.Frame(self.notebook)
        self.notebook.add(tab, text="CEF")
        frame = ttk.Frame(tab)
        frame.pack(fill="both", expand=True, padx=16, pady=16)
        ttk.Label(frame, text="Chromium Embedded Framework", font=("Segoe UI", 15, "bold")).pack(anchor="w")
        ttk.Label(frame, text="Download, validate, and package the complete Windows x64 CEF Standard Distribution.").pack(anchor="w", pady=(3, 12))
        buttons = ttk.Frame(frame); buttons.pack(fill="x", pady=(0, 12))
        ttk.Button(buttons, text="Download Latest Stable CEF x64", command=self.stage_cef).pack(side="left", padx=(0, 6))
        ttk.Button(buttons, text="Import Extracted CEF", command=self.import_cef_folder).pack(side="left", padx=6)
        ttk.Button(buttons, text="Validate CEF", command=self.validate_cef_ui).pack(side="left", padx=6)
        ttk.Button(buttons, text="Open CEF Folder", command=lambda: os.startfile(CEF_DIR)).pack(side="left", padx=6)
        info=ttk.LabelFrame(frame,text="Integration status");info.pack(fill="both",expand=True)
        self.cef_status=tk.Text(info,height=18,wrap="word",font=("Consolas",10),state="disabled")
        self.cef_status.pack(fill="both",expand=True,padx=8,pady=8)

    def build_options_tab(self):
        tab = ttk.Frame(self.notebook)
        self.notebook.add(tab, text="Build Options")

        frame = ttk.Frame(tab)
        frame.pack(fill="both", expand=True, padx=12, pady=12)

        ttk.Label(
            frame,
            text="CEF, Studio, and ISO Options",
            font=("Segoe UI", 12, "bold")
        ).pack(anchor="w", pady=(0, 8))

        ttk.Checkbutton(
            frame,
            text="Include full MinGW toolchain in ISO (required by Trusten Studio)",
            variable=self.include_full_mingw_var
        ).pack(anchor="w", pady=4)

        ttk.Checkbutton(frame, text="Include local web assets in ISO", variable=self.include_web_assets_var).pack(anchor="w", pady=4)
        ttk.Checkbutton(frame, text="Include complete CEF x64 runtime and resources in ISO", variable=self.include_cef_var).pack(anchor="w", pady=4)
        ttk.Checkbutton(
            frame,
            text="Include project source files in ISO",
            variable=self.include_project_source_var
        ).pack(anchor="w", pady=4)

        ttk.Checkbutton(
            frame,
            text="Clean work folder before build",
            variable=self.clean_work_before_build_var
        ).pack(anchor="w", pady=4)

        ttk.Checkbutton(
            frame,
            text="Clean build/adk/dism temp folders before build",
            variable=self.clean_temp_before_build_var
        ).pack(anchor="w", pady=4)

        ttk.Label(
            frame,
            text=(
                "This version fixes read-only / access denied copy problems.\n\n"
                f"Project:       {PROJECT_DIR}\n"
                f"Build temp:    {BUILD_TEMP_DIR}\n"
                f"ADK temp:      {ADK_TEMP_DIR}\n"
                f"DISM scratch:  {DISM_SCRATCH_DIR}\n"
                f"Logs:          {LOG_DIR}\n"
                f"Output ISO:    {OUT_DIR}\n\n"
                "If a MinGW file is locked or blocked, it will be skipped and logged to copy_warnings.log."
            ),
            justify="left"
        ).pack(anchor="w", pady=12)

    def build_log_tab(self):
        tab = ttk.Frame(self.notebook)
        self.notebook.add(tab, text="Build Log")

        self.log_text = tk.Text(
            tab,
            wrap="word",
            bg="#111827",
            fg="#e5e7eb",
            insertbackground="#e5e7eb"
        )
        self.log_text.pack(fill="both", expand=True, padx=8, pady=8)

    def log(self, msg):
        def append():
            self.log_text.insert("end", str(msg) + "\n")
            self.log_text.see("end")

        self.root.after(0, append)

    def show_info(self, title, message):
        self.root.after(0, lambda: messagebox.showinfo(title, message))

    def show_error(self, title, message):
        self.root.after(0, lambda: messagebox.showerror(title, message))

    def refresh_all(self):
        self.refresh_cpp_list()
        self.refresh_iso_tree()
        self.load_boot_script()

    def refresh_cpp_list(self):
        self.cpp_list.delete(0, "end")

        for cpp in sorted(SRC_DIR.glob("*.cpp")):
            self.cpp_list.insert("end", cpp.name)

    def refresh_iso_tree(self):
        self.iso_tree.delete(*self.iso_tree.get_children())

        def add_node(parent, path):
            for item in sorted(path.iterdir(), key=lambda p: (p.is_file(), p.name.lower())):
                node = self.iso_tree.insert(parent, "end", text=item.name, values=[str(item)])

                if item.is_dir():
                    add_node(node, item)

        root_node = self.iso_tree.insert("", "end", text=ISO_OVERLAY_DIR.name, values=[str(ISO_OVERLAY_DIR)])
        add_node(root_node, ISO_OVERLAY_DIR)
        self.iso_tree.item(root_node, open=True)

    def load_boot_script(self):
        if BOOT_SCRIPT_FILE.exists():
            self.boot_editor.delete("1.0", "end")
            self.boot_editor.insert("1.0", BOOT_SCRIPT_FILE.read_text(encoding="utf-8", errors="replace"))

    def on_cpp_select(self, event=None):
        sel = self.cpp_list.curselection()

        if not sel:
            return

        name = self.cpp_list.get(sel[0])
        path = SRC_DIR / name

        self.current_cpp_file = path
        self.cpp_editor.delete("1.0", "end")
        self.cpp_editor.insert("1.0", path.read_text(encoding="utf-8", errors="replace"))

    def on_iso_select(self, event=None):
        selected = self.iso_tree.selection()

        if not selected:
            return

        path = Path(self.iso_tree.item(selected[0], "values")[0])
        self.current_iso_file = None
        self.iso_editor.delete("1.0", "end")

        if path.is_file():
            self.iso_editor.insert("1.0", path.read_text(encoding="utf-8", errors="replace"))
            self.current_iso_file = path

    def new_cpp_file(self):
        name = simpledialog.askstring("New C++ file", "Name, example: app.cpp")

        if not name:
            return

        if not name.lower().endswith(".cpp"):
            name += ".cpp"

        path = SRC_DIR / name

        if path.exists():
            messagebox.showerror("Exists", "That file already exists.")
            return

        path.write_text(DEFAULT_CPP, encoding="utf-8")
        self.refresh_cpp_list()

    def delete_cpp_file(self):
        sel = self.cpp_list.curselection()

        if not sel:
            return

        name = self.cpp_list.get(sel[0])
        path = SRC_DIR / name

        if messagebox.askyesno("Delete", f"Delete {name}?"):
            path.unlink()
            self.current_cpp_file = None
            self.cpp_editor.delete("1.0", "end")
            self.refresh_cpp_list()

    def save_cpp_file(self):
        if not self.current_cpp_file:
            messagebox.showwarning("No file", "Select a C++ file first.")
            return

        self.current_cpp_file.write_text(self.cpp_editor.get("1.0", "end-1c"), encoding="utf-8")
        messagebox.showinfo("Saved", "C++ file saved.")

    def save_boot_script(self):
        text = self.boot_editor.get("1.0", "end-1c")
        errors = validate_boot_script(text)

        if errors:
            messagebox.showerror("Boot script problem", "\n".join(errors))
            return

        BOOT_SCRIPT_FILE.write_text(text, encoding="utf-8")
        messagebox.showinfo("Saved", "startnet.cmd saved.")

    def reset_boot_script(self):
        if messagebox.askyesno("Reset", "Reset startnet.cmd to default shell supervisor?"):
            BOOT_SCRIPT_FILE.write_text(DEFAULT_STARTNET, encoding="utf-8")
            self.load_boot_script()

    def new_iso_file(self):
        name = simpledialog.askstring("New ISO file", "File name:")

        if not name:
            return

        path = ISO_OVERLAY_DIR / name
        path.parent.mkdir(parents=True, exist_ok=True)

        if path.exists():
            messagebox.showerror("Exists", "That file already exists.")
            return

        path.write_text("", encoding="utf-8")
        self.refresh_iso_tree()

    def import_iso_file(self):
        src = filedialog.askopenfilename(title="Import file")

        if not src:
            return

        src = Path(src)
        copy_file_resilient(src, ISO_OVERLAY_DIR / src.name, log_func=None)
        self.refresh_iso_tree()

    def import_iso_folder(self):
        src = filedialog.askdirectory(title="Import folder")

        if not src:
            return

        src = Path(src)
        dst = ISO_OVERLAY_DIR / src.name

        if dst.exists():
            safe_rmtree(dst)

        copy_tree_resilient(src, dst, log_func=None)
        self.refresh_iso_tree()

    def delete_iso_selected(self):
        selected = self.iso_tree.selection()

        if not selected:
            return

        path = Path(self.iso_tree.item(selected[0], "values")[0])

        if path == ISO_OVERLAY_DIR:
            return

        if not messagebox.askyesno("Delete", f"Delete {path}?"):
            return

        if path.is_dir():
            safe_rmtree(path)
        else:
            force_writable(path)
            path.unlink()

        self.refresh_iso_tree()

    def save_iso_file(self):
        if not self.current_iso_file:
            messagebox.showwarning("No file", "Select a text file first.")
            return

        force_writable(self.current_iso_file)
        self.current_iso_file.write_text(self.iso_editor.get("1.0", "end-1c"), encoding="utf-8")
        messagebox.showinfo("Saved", "ISO overlay file saved.")

    def open_project_folder(self):
        os.startfile(PROJECT_DIR)

    def open_out_folder(self):
        OUT_DIR.mkdir(parents=True, exist_ok=True)
        os.startfile(OUT_DIR)

    def open_temp_folder(self):
        BUILD_TEMP_DIR.mkdir(parents=True, exist_ok=True)
        os.startfile(BUILD_TEMP_DIR)

    def open_logs_folder(self):
        LOG_DIR.mkdir(parents=True, exist_ok=True)
        os.startfile(LOG_DIR)

    def start_build_thread(self):
        threading.Thread(target=self.build_iso, daemon=True).start()

    def save_current_editors(self):
        if self.current_cpp_file:
            force_writable(self.current_cpp_file)
            self.current_cpp_file.write_text(self.cpp_editor.get("1.0", "end-1c"), encoding="utf-8")

        if self.current_iso_file:
            force_writable(self.current_iso_file)
            self.current_iso_file.write_text(self.iso_editor.get("1.0", "end-1c"), encoding="utf-8")

        force_writable(BOOT_SCRIPT_FILE)
        BOOT_SCRIPT_FILE.write_text(self.boot_editor.get("1.0", "end-1c"), encoding="utf-8")
        self.save_library_config(show_message=False)

    def patch_cef_headers_for_mingw(self, distribution):
        include_root = Path(distribution) / "include"
        if not include_root.is_dir():
            raise RuntimeError(f"CEF include folder is missing: {include_root}")
        patched = 0
        token = re.compile(r"\btimeout\b")
        for header in include_root.rglob("*.h"):
            text = header.read_text(encoding="utf-8", errors="replace")
            updated = token.sub("cef_timeout_value", text)
            if updated != text:
                force_writable(header)
                header.write_text(updated, encoding="utf-8")
                patched += 1
        self.log(f"CEF MinGW header compatibility: patched timeout identifier in {patched} header(s).")
        remaining = []
        for header in include_root.rglob("*.h"):
            text = header.read_text(encoding="utf-8", errors="replace")
            if token.search(text):
                remaining.append(str(header))
        if remaining:
            raise RuntimeError("CEF timeout compatibility patch incomplete:\n- " + "\n- ".join(remaining[:20]))

    def compile_cpp(self, kind, compiler, cpp_files, exe):
        sources = [Path(x) for x in cpp_files]
        if kind != "mingw":
            raise RuntimeError("CEF release build requires MinGW-w64 g++.")
        distribution = cef_distribution_root()
        errors, runtime = validate_cef_distribution()
        if errors:
            runtime = download_latest_cef_windows64(self.log)
            distribution = cef_distribution_root()
            errors, runtime = validate_cef_distribution()
        if errors or not distribution:
            raise RuntimeError("CEF is not ready:\n- " + "\n- ".join(errors))
        self.patch_cef_headers_for_mingw(distribution)
        command = [
            str(compiler), "-std=c++20", "-O2", "-pipe", "-DUNICODE", "-D_UNICODE", "-DTRUSTEN_CEF=1", "-Dtimeout=cef_timeout_value",
            f"-I{distribution}", *map(str, sources), "-o", str(exe), "-municode", "-mwindows",
            "-static-libgcc", "-static-libstdc++", "-luser32", "-lgdi32", "-lole32", "-luuid",
            "-lwinhttp", "-lcrypt32", "-lcomdlg32", "-lurlmon", "-lshlwapi", "-lshell32", "-ladvapi32"
        ]
        self.log(f"CEF include root: {distribution}")
        self.log("CEF runtime will be packaged beside main.exe after compilation.")
        run_command(command, self.log, cwd=PROJECT_DIR, env=create_build_env())

    def write_iso_manifest(
        self,
        media_dir,
        compiled_exes,
        compiler_kind,
        compiler,
        mingw_root,
        included_mingw,
        included_project_source,
        copy_skipped
    ):
        manifest = media_dir / "BUILD_CONTENTS.txt"
        lines = []

        lines.append("Custom C++ WinPE ISO Build Contents")
        lines.append("=" * 44)
        lines.append("")
        lines.append(f"Build time: {time.ctime()}")
        lines.append(f"Architecture: {ARCH}")
        lines.append(f"Compiler kind: {compiler_kind}")
        lines.append(f"Compiler path: {compiler}")
        lines.append("")
        lines.append("No-C pivot folders:")
        lines.append(f"Project folder: {PROJECT_DIR}")
        lines.append(f"Build temp: {BUILD_TEMP_DIR}")
        lines.append(f"ADK temp: {ADK_TEMP_DIR}")
        lines.append(f"DISM scratch: {DISM_SCRATCH_DIR}")
        lines.append(f"Logs: {LOG_DIR}")
        lines.append("")
        lines.append("Important ISO folders:")
        lines.append(f"- \\{COMPILED_DIR_NAME}")
        lines.append(f"- \\{MINGW_DIR_NAME} if full MinGW was enabled")
        lines.append(f"- \\{PROJECT_SRC_DIR_NAME} if source inclusion was enabled")
        lines.append("- \\BUILD_CONTENTS.txt")
        lines.append("")
        lines.append("Compiled EXEs copied to ISO:")

        for exe in compiled_exes:
            lines.append(f"- \\{COMPILED_DIR_NAME}\\{exe.name}")

        lines.append("")
        lines.append("ISO overlay copied from:")
        lines.append(str(ISO_OVERLAY_DIR))
        lines.append("")

        overlay_lines = make_relative_file_list(ISO_OVERLAY_DIR)

        if overlay_lines:
            lines.append("Overlay files:")
            for item in overlay_lines:
                lines.append(f"- \\{item}")
        else:
            lines.append("Overlay files: none")

        lines.append("")

        if included_mingw and mingw_root:
            lines.append("Full MinGW toolchain included: yes")
            lines.append(f"Source: {mingw_root}")
            lines.append(f"ISO path: \\{MINGW_DIR_NAME}")

            count, total = count_files_and_size(media_dir / MINGW_DIR_NAME)
            lines.append(f"MinGW copied files in ISO: {count}")
            lines.append(f"MinGW copied size in ISO: {format_size(total)}")
        else:
            lines.append("Full MinGW toolchain included: no")

        lines.append("")

        if included_project_source:
            lines.append("Project source included: yes")
            lines.append(f"ISO path: \\{PROJECT_SRC_DIR_NAME}")

            count, total = count_files_and_size(media_dir / PROJECT_SRC_DIR_NAME)
            lines.append(f"Project source copied files: {count}")
            lines.append(f"Project source copied size: {format_size(total)}")
        else:
            lines.append("Project source included: no")

        lines.append("")
        lines.append(f"Skipped copy items: {copy_skipped}")
        lines.append("If skipped copy items is above 0, see logs\\copy_warnings.log.")
        lines.append("")
        lines.append(f"- CEF web assets: \\{WEB_ASSETS_DIR_NAME}")
        lines.append("- WebView2 loader: \\apps\\WebView2Loader.dll")
        lines.append("- WebView2 offline runtime: \\webview2_runtime")
        lines.append("")
        lines.append("Boot behavior:")
        lines.append("- WinPE runs startnet.cmd from boot.wim.")
        lines.append(f"- startnet.cmd searches for \\{COMPILED_DIR_NAME}\\main.exe or selected main EXE.")
        lines.append("- If full MinGW is included, startnet.cmd adds \\mingw\\bin to PATH.")

        manifest.write_text("\n".join(lines), encoding="utf-8")

    def clean_temp_folders(self):
        for folder in [BUILD_TEMP_DIR, ADK_TEMP_DIR, DISM_SCRATCH_DIR]:
            safe_rmtree(folder)
            folder.mkdir(parents=True, exist_ok=True)

    def build_iso(self):
        try:
            self.root.after(0, lambda: self.notebook.select(self.notebook.tabs()[-1]))
            self.log("=== Build started ===")
            self.log(f"Project folder: {PROJECT_DIR}")

            if not is_admin():
                raise RuntimeError("The app is not running as Administrator.")

            self.save_current_editors()

            boot_text = BOOT_SCRIPT_FILE.read_text(encoding="utf-8", errors="replace")
            boot_errors = validate_boot_script(boot_text)

            if boot_errors:
                raise RuntimeError("startnet.cmd errors:\n" + "\n".join(boot_errors))

            include_full_mingw = True
            include_project_source = True
            self.log("Release package mode: WinPE + native Trusten main.exe + full MinGW + source")
            include_web_assets = bool(self.include_web_assets_var.get())
            include_cef = bool(self.include_cef_var.get())
            clean_work_before_build = bool(self.clean_work_before_build_var.get())
            clean_temp_before_build = bool(self.clean_temp_before_build_var.get())

            copy_warning_log = LOG_DIR / "copy_warnings.log"
            if copy_warning_log.exists():
                force_writable(copy_warning_log)
                copy_warning_log.unlink()

            if clean_temp_before_build:
                self.log("Cleaning build/adk/dism temp folders...")
                self.clean_temp_folders()

            compiler_kind, compiler = find_compiler()
            if not compiler:
                raise RuntimeError("No installed C++ compiler was found. Ensure g++.exe is on PATH.")
            if compiler_kind != "mingw":
                raise RuntimeError("This CEF direct C API builder currently requires MinGW-w64 g++.")

            copype = find_adk_tool("copype.cmd")
            makewinpemedia = find_adk_tool("MakeWinPEMedia.cmd")
            oscdimg = find_adk_tool("oscdimg.exe")

            if not copype:
                raise RuntimeError("Could not find copype.cmd.")

            if not makewinpemedia:
                raise RuntimeError("Could not find MakeWinPEMedia.cmd.")

            if not oscdimg:
                raise RuntimeError("Could not find oscdimg.exe.")

            adk_env = create_adk_env(copype, oscdimg)

            mingw_root = None

            if compiler_kind == "mingw":
                mingw_root = find_mingw_root(compiler)

                if include_full_mingw:
                    if not mingw_root or not mingw_root.exists():
                        raise RuntimeError(
                            "MinGW compiler was found, but the MinGW root folder could not be detected."
                        )

            self.log(f"Compiler: {compiler_kind} at {compiler}")
            self.log(f"Compiler temp folder: {BUILD_TEMP_DIR}")
            self.log(f"ADK temp folder: {ADK_TEMP_DIR}")
            self.log(f"DISM scratch folder: {DISM_SCRATCH_DIR}")
            self.log(f"Logs folder: {LOG_DIR}")
            self.log(f"CopyPE: {copype}")
            self.log(f"MakeWinPEMedia: {makewinpemedia}")
            self.log(f"Oscdimg: {oscdimg}")
            self.log(f"WinPERoot: {adk_env.get('WinPERoot')}")
            self.log(f"OSCDImgRoot: {adk_env.get('OSCDImgRoot')}")

            if compiler_kind == "mingw":
                self.log(f"Detected MinGW root: {mingw_root}")
                self.log(f"Include full MinGW toolchain: {'YES' if include_full_mingw else 'NO'}")
            else:
                self.log("Using MSVC. Full MinGW inclusion does not apply.")

            self.log(f"Include project source: {'YES' if include_project_source else 'NO'}")

            main_source = SRC_DIR / "main.cpp"
            if main_source.exists():
                source_text = main_source.read_text(encoding="utf-8", errors="replace")
                source_text = source_text.replace("std::filesystem::path(executable).parent_path()", "std::filesystem::path(executable).root_path()")
                main_source.write_text(source_text, encoding="utf-8")
            # CEF must never prevent the Trusten desktop from starting. If CEF cannot
            # initialize in WinPE, continue with the native shell and leave web apps disabled.
            if main_source.exists():
                source_text = main_source.read_text(encoding="utf-8", errors="replace")
                source_text = source_text.replace(
                    "if(!cef_initialize(&args,&settings,nullptr,nullptr))return cef_get_exit_code();",
                    "const bool cefInitialized=cef_initialize(&args,&settings,nullptr,nullptr)!=0;"
                )
                source_text = source_text.replace(
                    "if (!cef_initialize(&args, &settings, nullptr, nullptr)) return cef_get_exit_code();",
                    "const bool cefInitialized=cef_initialize(&args,&settings,nullptr,nullptr)!=0;"
                )
                source_text = source_text.replace(
                    "cef_shutdown();return result;",
                    "if(cefInitialized)cef_shutdown();return result;"
                )
                source_text = source_text.replace(
                    "cef_shutdown(); return result;",
                    "if(cefInitialized)cef_shutdown(); return result;"
                )
                main_source.write_text(source_text, encoding="utf-8")
            # Permanent CEF/MinGW guard: this project loads libcef.dll dynamically,
            # so no source may directly call exported CEF string helpers. Such calls
            # compile but fail at link time without a MinGW import library.
            for source_file in SRC_DIR.rglob("*.cpp"):
                source_text = source_file.read_text(encoding="utf-8", errors="replace")
                forbidden_cef_symbols = (
                    "cef_string_utf16_set", "cef_string_utf16_clear",
                    "cef_string_set(", "cef_string_clear(",
                )
                found = [symbol for symbol in forbidden_cef_symbols if symbol in source_text]
                if found:
                    raise RuntimeError(
                        f"{source_file.name} still directly references CEF DLL exports: "
                        + ", ".join(found)
                        + ". Replace src/main.cpp with main_cef_permanent_fixed.cpp."
                    )

            cpp_files = sorted(SRC_DIR.rglob("*.cpp"))

            if not cpp_files:
                raise RuntimeError("No .cpp files found in src.")

            compiled_dir = PROJECT_DIR / "compiled"
            safe_rmtree(compiled_dir)
            compiled_dir.mkdir(parents=True, exist_ok=True)

            main_exe = compiled_dir / "main.exe"
            self.compile_cpp(compiler_kind, compiler, cpp_files, main_exe)
            compiled_exes = [main_exe]

            if not main_exe.exists():
                raise RuntimeError(f"Compiler output was not found: {main_exe}")

            self.log(f"Main boot EXE: {main_exe.name}")

            if clean_work_before_build:
                self.log("Cleaning work folder with read-only fix...")
                safe_rmtree(WORK_DIR)

            WORK_DIR.mkdir(parents=True, exist_ok=True)

            winpe_work = WORK_DIR / "WinPE_amd64"

            if winpe_work.exists():
                self.log("Removing previous WinPE work directory...")
                safe_rmtree(winpe_work)

            run_command([
                "cmd",
                "/d",
                "/c",
                "call",
                str(copype),
                ARCH,
                str(winpe_work)
            ], self.log, env=adk_env)

            media_dir = winpe_work / "media"
            apps_dir = media_dir / COMPILED_DIR_NAME
            apps_dir.mkdir(parents=True, exist_ok=True)

            copy_skipped_total = 0

            self.log("Copying ISO overlay files...")
            overlay_copied, overlay_skipped = copy_tree_contents(ISO_OVERLAY_DIR, media_dir, log_func=self.log)
            copy_skipped_total += overlay_skipped
            self.log(f"Overlay copied files: {overlay_copied}")
            self.log(f"Overlay skipped files: {overlay_skipped}")

            self.log("Copying compiled EXEs...")

            for exe in compiled_exes:
                target_exe = apps_dir / exe.name
                if copy_file_resilient(exe, target_exe, log_func=self.log):
                    self.log(f"Copied EXE: \\{COMPILED_DIR_NAME}\\{exe.name}")
                else:
                    copy_skipped_total += 1
                    raise RuntimeError(f"Could not copy compiled EXE: {exe}")

            if include_cef:
                self.log("Staging complete CEF runtime into ISO media tree...")
                copy_skipped_total += package_complete_cef(media_dir, apps_dir, self.log)
            else:
                self.log("CEF packaging is disabled by the Build Options checkbox.")

            included_web_assets = False
            if include_web_assets:
                web_dst = media_dir / WEB_ASSETS_DIR_NAME
                if web_dst.exists():
                    safe_rmtree(web_dst)
                copied, skipped = copy_tree_resilient(WEB_ASSETS_DIR, web_dst, log_func=self.log)
                copy_skipped_total += skipped
                self.log(f"Web assets copied: {copied}; skipped: {skipped}")
                included_web_assets = True

            included_mingw = False

            if compiler_kind == "mingw" and include_full_mingw:
                mingw_dst = media_dir / MINGW_DIR_NAME

                self.log("")
                self.log("Copying full MinGW toolchain into ISO with resilient copy...")
                self.log(f"From: {mingw_root}")
                self.log(f"To: {mingw_dst}")

                if mingw_dst.exists():
                    self.log("Removing previous MinGW folder with read-only fix...")
                    safe_rmtree(mingw_dst)

                mingw_copied, mingw_skipped = copy_tree_resilient(mingw_root, mingw_dst, log_func=self.log)
                copy_skipped_total += mingw_skipped

                count, total = count_files_and_size(mingw_dst)
                self.log(f"MinGW copied attempts successful: {mingw_copied}")
                self.log(f"MinGW skipped files: {mingw_skipped}")
                self.log(f"MinGW files now in ISO tree: {count}")
                self.log(f"MinGW copied size: {format_size(total)}")

                included_mingw = True

            elif compiler_kind == "mingw":
                self.log("Full MinGW toolchain inclusion disabled.")

            included_project_source = False

            if include_project_source:
                project_src_dst = media_dir / PROJECT_SRC_DIR_NAME

                self.log("")
                self.log("Copying project source into ISO...")
                self.log(f"To: {project_src_dst}")

                if project_src_dst.exists():
                    safe_rmtree(project_src_dst)

                src_copied, src_skipped = copy_selected_project_source(project_src_dst, log_func=self.log)
                copy_skipped_total += src_skipped

                count, total = count_files_and_size(project_src_dst)
                self.log(f"Project source copied files: {src_copied}")
                self.log(f"Project source skipped files: {src_skipped}")
                self.log(f"Project source files now in ISO tree: {count}")
                self.log(f"Project source copied size: {format_size(total)}")

                included_project_source = True

            if not included_mingw:
                raise RuntimeError("Complete MinGW toolchain is required but was not packaged")
            validate_complete_os_tree(media_dir, apps_dir, mingw_dst, self.log)
            if not included_mingw: raise RuntimeError("Full MinGW was not packaged")
            validate_complete_tree(media_dir, apps_dir, mingw_dst)
            self.write_iso_manifest(
                media_dir=media_dir,
                compiled_exes=compiled_exes,
                compiler_kind=compiler_kind,
                compiler=compiler,
                mingw_root=mingw_root,
                included_mingw=included_mingw,
                included_project_source=included_project_source,
                copy_skipped=copy_skipped_total
            )

            self.log("Wrote ISO manifest: \\BUILD_CONTENTS.txt")

            if copy_skipped_total > 0:
                self.log(f"Copy warnings were written to: {copy_warning_log}")

            boot_wim = media_dir / "sources" / "boot.wim"
            mount_dir = WORK_DIR / "mount"

            if not boot_wim.exists():
                raise RuntimeError(f"Missing boot.wim: {boot_wim}")

            if mount_dir.exists():
                safe_rmtree(mount_dir)

            mount_dir.mkdir(parents=True, exist_ok=True)

            try:
                run_dism([
                    "/Mount-Image",
                    f"/ImageFile:{boot_wim}",
                    "/index:1",
                    f"/MountDir:{mount_dir}"
                ], self.log, env=adk_env, log_name="dism_mount.log")

                final_startnet = build_final_startnet(
                    boot_text=boot_text,
                    main_exe_name=main_exe.name,
                    include_mingw=included_mingw,
                    include_webview2=False
                )

                target_startnet = mount_dir / "Windows" / "System32" / "startnet.cmd"
                force_writable(target_startnet)
                target_startnet.write_text(final_startnet, encoding="utf-8")

                self.log(f"Injected startup script: {target_startnet}")
                if include_cef:
                    cef_required = [apps_dir / "libcef.dll", apps_dir / "chrome_elf.dll", media_dir / "cef" / "icudtl.dat", media_dir / "cef" / "resources.pak"]
                    cef_missing = [str(path) for path in cef_required if not path.is_file()]
                    if cef_missing:
                        raise RuntimeError("ISO creation blocked: CEF files are missing:\n- " + "\n- ".join(cef_missing))
                    self.log("Verified complete CEF runtime and resources inside ISO media tree.")

                run_dism([
                    "/Unmount-Image",
                    f"/MountDir:{mount_dir}",
                    "/commit"
                ], self.log, env=adk_env, log_name="dism_commit.log")

            except Exception:
                self.log("Attempting DISM discard cleanup...")

                try:
                    run_dism([
                        "/Unmount-Image",
                        f"/MountDir:{mount_dir}",
                        "/discard"
                    ], self.log, env=adk_env, log_name="dism_discard.log")

                except Exception as cleanup_error:
                    self.log(f"Cleanup warning: {cleanup_error}")

                try:
                    run_dism([
                        "/Cleanup-Wim"
                    ], self.log, env=adk_env, log_name="dism_cleanup_wim.log")

                except Exception as cleanup_wim_error:
                    self.log(f"Cleanup-Wim warning: {cleanup_wim_error}")

                raise

            tmp_iso = OUT_DIR / "CustomCppWinPE.tmp.iso"
            final_iso = OUT_DIR / DEFAULT_ISO_NAME

            if tmp_iso.exists():
                force_writable(tmp_iso)
                tmp_iso.unlink()

            if final_iso.exists():
                force_writable(final_iso)
                final_iso.unlink()

            # Build the ISO with Oscdimg directly.  MakeWinPEMedia.cmd can return
            # exit code 255 when its batch environment, quoting, or temporary
            # workspace handling fails even though the staged WinPE tree is valid.
            # Direct Oscdimg invocation removes that fragile wrapper and preserves
            # both BIOS and UEFI boot support.
            bios_boot = winpe_work / "fwfiles" / "etfsboot.com"
            uefi_boot = winpe_work / "fwfiles" / "efisys.bin"
            staged_media = winpe_work / "media"

            missing_boot_files = [
                str(path) for path in (bios_boot, uefi_boot) if not path.is_file()
            ]
            if not staged_media.is_dir():
                raise RuntimeError(f"ISO media tree is missing: {staged_media}")
            if missing_boot_files:
                raise RuntimeError(
                    "ISO boot files are missing:\n- " + "\n- ".join(missing_boot_files)
                )

            boot_data = (
                f"-bootdata:2#p0,e,b{bios_boot}"
                f"#pEF,e,b{uefi_boot}"
            )
            run_command([
                str(oscdimg),
                "-m",
                "-o",
                "-u2",
                "-udfver102",
                boot_data,
                str(staged_media),
                str(tmp_iso),
            ], self.log, env=adk_env)

            if not tmp_iso.is_file() or tmp_iso.stat().st_size == 0:
                raise RuntimeError("Oscdimg completed but no valid ISO was produced.")

            tmp_iso.rename(final_iso)

            final_size = final_iso.stat().st_size if final_iso.exists() else 0

            self.log("=== Build complete ===")
            self.log(f"Output ISO: {final_iso}")
            self.log(f"ISO size: {format_size(final_size)}")

            if copy_skipped_total > 0:
                self.log(f"Skipped copy items: {copy_skipped_total}")
                self.log(f"See warnings: {copy_warning_log}")

            self.show_info(
                "Build complete",
                f"ISO created:\n{final_iso}\n\nSize: {format_size(final_size)}\n\nSkipped copy items: {copy_skipped_total}"
            )

        except Exception as e:
            self.log("\n=== BUILD FAILED ===")
            self.log(str(e))
            self.show_error("Build failed", str(e))


def main():
    if os.name != "nt":
        root = tk.Tk()
        root.withdraw()
        messagebox.showerror("Windows only", "This builder is Windows-only.")
        root.destroy()
        return

    ensure_admin_or_relaunch()
    ensure_project()

    root = tk.Tk()
    BuilderApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
